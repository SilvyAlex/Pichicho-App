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
import { Router } from '@angular/router';

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// ✅ NUEVO: plugin de cámara de Capacitor
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
  petName  = '';
  profileId: string | null = null;

  @ViewChild('video')  videoRef!: ElementRef<HTMLVideoElement>;
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
    const profile = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName  = profile.nombrePerro;
      this.profileId = profile.id;
    }
  }

  async ngAfterViewInit() {
    // 🔹 En web seguimos usando la cámara del navegador
    // 🔹 En APK (nativo) NO iniciamos getUserMedia, usamos el plugin al disparar la foto
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

  // ======= BOTÓN DISPARO (misma lógica externa) =======
  async onShutter() {
    // Si ya hay foto, resetear y volver a mostrar cámara
    if (this.photoDataUrl) {
      this.photoDataUrl = null;
      if (!this.isNative) {
        await this.startCamera();
      }
      // En nativo no hace falta reiniciar nada, la próxima vez se vuelve a abrir la cámara
      return;
    }

    // Tomar foto dependiendo de la plataforma
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
      // 🔐 Pedir permisos si aún no los tiene
      await Camera.requestPermissions({
        permissions: ['camera']
      });

      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl, // ⬅️ para seguir usando photoDataUrl
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true
      });

      this.photoDataUrl = photo.dataUrl || null;
    } catch (err) {
      console.warn('No se pudo tomar la foto (nativo) o el usuario canceló:', err);
    }
  }

  /** Guardar evidencia de comida */
  async saveEvidence() {
    if (!this.photoDataUrl || !this.profileId) return;

    const profile = this.session.snapshot;
    if (!profile) return;

    try {
      const fotoUrl = await this.firebaseSvc.uploadEvidencePhoto(this.photoDataUrl, this.petName);
      await this.firebaseSvc.addEvidenceDate(this.profileId, 'comida', fotoUrl);

      // 🧮 Actualizar puntos locales
      const nuevosPuntos = (profile.puntos || 0) + 5;
      await this.session.setProfile({ ...profile, puntos: nuevosPuntos });

      console.log('✅ Evidencia de comida guardada correctamente');

      // ✅ Pausa antes de volver al Home
      setTimeout(() => {
        this.router.navigateByUrl('/home');
      }, 800);

    } catch (err) {
      console.error('❌ Error al guardar evidencia de comida:', err);
    }
  }

  async speakCard() {
    const text = `¡Qué bien lo hicieron! Ahora toma una foto de ${this.petName}.`;

    if (!text.trim()) return;

    const isNative = this.isNative;

    if (!isNative) {
      // ===== Entorno web → Web Speech API =====
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
