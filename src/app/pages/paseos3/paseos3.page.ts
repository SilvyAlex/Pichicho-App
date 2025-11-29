import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
import { chevronBackOutline, volumeHighOutline, cameraOutline } from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';
import { Router } from '@angular/router';

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// ✅ NUEVO: plugin de cámara de Capacitor
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-paseos3',
  templateUrl: './paseos3.page.html',
  styleUrls: ['./paseos3.page.scss'],
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
export class Paseos3Page implements OnInit, AfterViewInit, OnDestroy {
  userName = '';
  petName = '';
  profileId: string | null = null;

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  isStreaming = false;
  photoDataUrl: string | null = null;

  // ✅ Saber si estamos en APK (nativo) o en web
  readonly isNative = Capacitor.isNativePlatform();

  constructor(
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private router: Router
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, cameraOutline });
  }

  ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.profileId = profile.id!;
    }
  }

  async ngAfterViewInit() {
    // En web iniciamos la cámara del navegador; en nativo usamos el plugin al disparar
    if (!this.isNative) {
      await this.startCamera();
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  // ======= CÁMARA WEB (solo navegador / localhost) =======
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
      console.warn('No se pudo iniciar la cámara (web):', err);
      this.isStreaming = false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.isStreaming = false;
  }

  // ======= BOTÓN DISPARO =======
  async onShutter() {
    // Si ya hay foto, resetear y volver a la cámara
    if (this.photoDataUrl) {
      this.photoDataUrl = null;
      if (!this.isNative) {
        await this.startCamera();
      }
      return;
    }

    // Tomar foto según plataforma
    if (this.isNative) {
      await this.takePhotoNative();
    } else {
      this.takePhotoWeb();
    }
  }

  // ======= FOTO EN WEB (lo que ya tenías) =======
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

  // ======= FOTO EN APK (Android / iOS) CON PERMISOS =======
  async takePhotoNative() {
    try {
      // 🔐 Pedir permisos de cámara
      await Camera.requestPermissions({
        permissions: ['camera']
      });

      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl, // seguimos trabajando con photoDataUrl
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true
      });

      this.photoDataUrl = photo.dataUrl || null;
    } catch (err) {
      console.warn('No se pudo tomar la foto (nativo) o el usuario canceló:', err);
    }
  }

  /** 💾 Guardar evidencia del paseo */
  async saveEvidence() {
    if (!this.photoDataUrl || !this.profileId) return;

    const profile = this.session.snapshot;
    if (!profile) return;

    try {
      const fotoUrl = await this.firebaseSvc.uploadEvidencePhoto(this.photoDataUrl, this.petName);
      await this.firebaseSvc.addEvidenceDate(this.profileId, 'paseo', fotoUrl);

      // 🧮 Actualizar puntos locales
      const nuevosPuntos = (profile.puntos || 0) + 10;
      await this.session.setProfile({ ...profile, puntos: nuevosPuntos });

      console.log('✅ Evidencia de paseo guardada correctamente');

      // Esperar breve para que Firebase procese y Home se actualice
      setTimeout(() => {
        this.router.navigateByUrl('/home');
      }, 800);

    } catch (err) {
      console.error('❌ Error al guardar evidencia de paseo:', err);
    }
  }

  async speakCard() {
    const text = `¡Qué bien lo hicieron! Ahora toma una foto de ${this.petName || 'tu perrito'}.`;

    if (!text.trim()) return;

    const isNative = this.isNative;

    if (!isNative) {
      // ===== Web (localhost / navegador) → Web Speech API =====
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      try {
        const synth = (window as any).speechSynthesis;
        synth.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        utter.rate = 0.95;

        synth.speak(utter);
      } catch (e) {
        console.warn('No se pudo reproducir la locución:', e);
      }
    } else {
      // ===== APK (Android / iOS) → Plugin nativo de TTS =====
      try {
        await TextToSpeech.stop();

        await TextToSpeech.speak({
          text,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
      }
    }
  }
}
