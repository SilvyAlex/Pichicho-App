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
import { Firestore, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Router } from '@angular/router';

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

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  isStreaming = false;
  photoDataUrl: string | null = null;

  constructor(
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private firestore: Firestore,
    private router: Router
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, cameraOutline });
  }

  ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
    }
  }

  async ngAfterViewInit() {
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  /** Enciende la cámara */
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

  /** Apaga la cámara */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.isStreaming = false;
  }

  /** Tomar o rehacer foto */
  async onShutter() {
    if (this.photoDataUrl) {
      this.photoDataUrl = null;
      await this.startCamera();
      return;
    }
    this.takePhoto();
  }

  /** Captura en canvas */
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

  /** Guardar evidencia (Paseo) */
async saveEvidence() {
  if (!this.photoDataUrl) return;
  const profile = this.session.snapshot;
  if (!profile) return;

  try {
    // 1️⃣ Subir foto al Storage
    const fotoUrl = await this.firebaseSvc.uploadEvidencePhoto(
      this.photoDataUrl,
      profile.nombrePerro
    );

    // 2️⃣ Guardar evidencia tipo 'paseo' en Firestore
    await this.firebaseSvc.addEvidenceDate(profile.id, 'paseo', fotoUrl);

    // 3️⃣ Actualizar sesión local (solo puntos)
    const nuevosPuntos = (profile.puntos || 0) + 10;
    await this.session.setProfile({
      ...profile,
      puntos: nuevosPuntos
    });

    console.log('✅ Evidencia de paseo guardada correctamente');
    this.router.navigateByUrl('/home');
  } catch (err) {
    console.error('❌ Error al guardar evidencia de paseo:', err);
  }
}



  /** Reproduce el audio */
  speakCard() {
    const text = `¡Qué bien lo hicieron! Ahora toma una foto de ${this.petName}.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        synth.cancel();
        synth.speak(utter);
      }
    } catch {}
  }
}
