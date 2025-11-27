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
import { TextToSpeech } from '@capacitor-community/text-to-speech'

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
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

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
      console.warn('No se pudo iniciar la cámara:', err);
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

  async onShutter() {
    if (this.photoDataUrl) {
      this.photoDataUrl = null;
      await this.startCamera();
      return;
    }
    this.takePhoto();
  }

  takePhoto() {
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

      // ✅ Pequeña pausa antes de volver al Home para que Firebase termine de escribir
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

    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      // ===== Entorno web (localhost / navegador) → Web Speech API =====
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
