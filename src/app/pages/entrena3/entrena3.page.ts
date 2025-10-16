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
  IonIcon,
  ToastController
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
import { Profile } from '../../models/profile.model';

@Component({
  selector: 'app-entrena3',
  templateUrl: './entrena3.page.html',
  styleUrls: ['./entrena3.page.scss'],
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
export class Entrena3Page implements OnInit, AfterViewInit, OnDestroy {
  userName = '';
  petName = '';
  profileId = '';

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  photoDataUrl: string | null = null;

  trainedToday = false;   // ✅ solo 1 por día
  isSaving = false;       // evita dobles taps
  cameraReady = false;

  constructor(
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, cameraOutline });
  }

  async ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.profileId = profile.id!;
    }

    // Verificar si ya existe evidencia hoy
    await this.checkTrainedToday();
  }

  async ngAfterViewInit() {
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  /** 🔍 Verifica si ya se entrenó hoy (bloquea si es así) */
  private async checkTrainedToday() {
    if (!this.profileId) return;
    const { trainedToday } = await this.firebaseSvc.getDailyTrainingStatus(this.profileId);
    this.trainedToday = trainedToday;
  }

  /** 🎥 Enciende la cámara */
  async startCamera() {
    if (this.trainedToday) {
      // Si ya entrenó hoy, no iniciamos cámara para evitar confusión
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      const video = this.videoRef?.nativeElement;
      if (!video) return;
      video.srcObject = this.stream;
      await video.play();
      this.cameraReady = true;
    } catch (err) {
      this.cameraReady = false;
      await this.showToast('No se pudo acceder a la cámara. Revisa permisos.');
      console.warn('No se pudo iniciar la cámara:', err);
    }
  }

  /** ⏹️ Apaga la cámara */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cameraReady = false;
  }

  /** 📸 Tomar o rehacer foto */
  async onShutter() {
    if (this.trainedToday) {
      await this.showToast('✅ Ya registraste el entrenamiento de hoy');
      return;
    }

    if (this.photoDataUrl) {
      // Rehacer foto
      this.photoDataUrl = null;
      await this.startCamera();
      return;
    }
    this.takePhoto();
  }

  /** 🧱 Captura frame en canvas → dataURL */
  takePhoto() {
    if (!this.cameraReady) return;
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
    this.photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Apagar cámara al tener foto
    this.stopCamera();
  }

  /** 💾 Guarda evidencia con foto (única que cuenta para 1/1) */
  async saveEvidence() {
    if (this.isSaving) return;
    if (this.trainedToday) {
      await this.showToast('✅ Ya registraste el entrenamiento de hoy');
      return;
    }
    if (!this.photoDataUrl) {
      await this.showToast('Primero toma una foto como evidencia');
      return;
    }
    const profile = this.session.snapshot;
    if (!profile || !this.profileId) return;

    this.isSaving = true;
    try {
      // 1) Subir foto a Storage
      const fotoUrl = await this.firebaseSvc.uploadEvidencePhoto(
        this.photoDataUrl,
        profile.nombrePerro
      );

      // 2) Registrar evidencia en Firestore (suma puntos)
      await this.firebaseSvc.addEvidenceDate(this.profileId, 'entrenamiento', fotoUrl);

      // 3) Marcar como entrenado hoy (bloqueo)
      this.trainedToday = true;

      // 4) Feedback + volver al home
      await this.showToast('¡Evidencia guardada! 🐕‍🦺');
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (err) {
      console.error('❌ Error al guardar evidencia de entrenamiento:', err);
      await this.showToast('Error al guardar la evidencia. Intenta de nuevo.');
    } finally {
      this.isSaving = false;
    }
  }

  /** 🔊 Audio */
  speakCard() {
    const text = this.trainedToday
      ? `¡Excelente! Ya registraste el entrenamiento de hoy.`
      : `¡Qué bien lo hicieron! Ahora toma una foto de ${this.petName}.`;
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

  /** 💬 Toast helper */
  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }
}
