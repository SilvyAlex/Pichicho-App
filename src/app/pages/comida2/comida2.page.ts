import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  cameraOutline
} from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';
import { Router } from '@angular/router';

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-comida2',
  templateUrl: './comida2.page.html',
  styleUrls: ['./comida2.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    CommonModule,
    FormsModule
  ]
})
export class Comida2Page implements OnInit, AfterViewInit, OnDestroy {
  userName = '';
  petName = '';
  profileId: string | null = null;

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  isStreaming = false;
  photoDataUrl: string | null = null;

  readonly isNative = Capacitor.isNativePlatform();

  /** 🔊 NUEVO: estado del audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private router: Router
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, cameraOutline });
  }

  ngOnInit() {
    const profile = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.profileId = profile.id;
    }
  }

  async ngAfterViewInit() {
    if (!this.isNative) await this.startCamera();
  }

  /** 🚪 Cortar audio al salir */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
    this.stopCamera();
  }

  /* ================================
     CÁMARA WEB
  ===================================*/
  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      const video = this.videoRef?.nativeElement;
      if (!video) return;

      video.srcObject = this.stream;
      await video.play();
      this.isStreaming = true;
    } catch (err) {
      console.warn('No se pudo iniciar cámara web:', err);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.isStreaming = false;
  }

  /* ================================
     BOTÓN DISPARO
  ===================================*/
  async onShutter() {
    this.stopSpeech(); // cortar audio si estaba sonando

    if (this.photoDataUrl) {
      this.photoDataUrl = null;
      if (!this.isNative) await this.startCamera();
      return;
    }

    if (this.isNative) {
      await this.takePhotoNative();
    } else {
      this.takePhotoWeb();
    }
  }

  takePhotoWeb() {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas) return;

    const w = video.videoWidth || 720;
    const h = video.videoHeight || 1280;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    this.photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.stopCamera();
  }

  async takePhotoNative() {
    try {
      await Camera.requestPermissions({ permissions: ['camera'] });

      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true
      });

      this.photoDataUrl = photo.dataUrl || null;
    } catch (err) {
      console.warn('Error tomando foto nativa:', err);
    }
  }

  /* ================================
     GUARDAR EVIDENCIA
  ===================================*/
  async saveEvidence() {
    if (!this.photoDataUrl || !this.profileId) return;

    this.stopSpeech(); // evitar que siga hablando

    try {
      const fotoUrl = await this.firebaseSvc.uploadEvidencePhoto(
        this.photoDataUrl,
        this.petName
      );

      await this.firebaseSvc.addEvidenceDate(
        this.profileId,
        'comida',
        fotoUrl
      );

      const profile = this.session.snapshot;
      if (profile) {
        const nuevosPuntos = (profile.puntos || 0) + 5;
        await this.session.setProfile({
          ...profile,
          puntos: nuevosPuntos
        });
      }

      setTimeout(() => {
        this.router.navigateByUrl('/home');
      }, 800);
    } catch (err) {
      console.error('Error guardando evidencia:', err);
    }
  }

  /* ================================
     AUDIO — TOGGLE
  ===================================*/

  async speakCard() {
    const text = `¡Qué bien lo hicieron! Ahora toma una foto de ${this.petName}.`;
    await this.toggleSpeech(text);
  }

  private async toggleSpeech(text: string) {
    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }
    await this.speak(text);
  }

  private async speak(text: string) {
    if (!text.trim()) return;

    const isNative = this.isNative;
    this.isSpeaking = true;

    if (!isNative) {
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        this.isSpeaking = false;
        return;
      }

      const synth = (window as any).speechSynthesis;
      synth.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utter;
      utter.lang = 'es-ES';
      utter.rate = 0.95;

      utter.onend = () => {
        if (this.currentUtterance === utter) {
          this.isSpeaking = false;
          this.currentUtterance = null;
        }
      };

      utter.onerror = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
      };

      synth.speak(utter);
    } else {
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({
          text,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1
        });
      } catch (_) {
      } finally {
        this.isSpeaking = false;
      }
    }
  }

  private stopSpeech() {
    const isNative = this.isNative;

    if (!isNative) {
      if ('speechSynthesis' in window)
        (window as any).speechSynthesis.cancel();
    } else {
      TextToSpeech.stop().catch(() => {});
    }

    this.isSpeaking = false;
    this.currentUtterance = null;
  }
}
