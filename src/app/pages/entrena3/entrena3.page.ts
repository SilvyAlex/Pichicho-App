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
import { ActivatedRoute } from '@angular/router';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

// ✅ NUEVO: plugin de cámara de Capacitor
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  activityId = '';

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  photoDataUrl: string | null = null;

  trainedToday = false;   // ✅ solo 1 por día
  isSaving = false;       // evita dobles taps
  cameraReady = false;

  // ✅ Saber si estamos en APK (nativo) o en web
  readonly isNative = Capacitor.isNativePlatform();

  constructor(
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private router: Router,
    private toastCtrl: ToastController,
    private route: ActivatedRoute
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

    // 👇 ID del entrenamiento elegido
    this.activityId = this.route.snapshot.paramMap.get('id') || '';

    // Verificar si ya existe evidencia hoy
    await this.checkTrainedToday();
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

  /** 🔍 Verifica si ya se entrenó hoy (bloquea si es así) */
  private async checkTrainedToday() {
    if (!this.profileId) return;
    const { trainedToday } = await this.firebaseSvc.getDailyTrainingStatus(this.profileId);
    this.trainedToday = trainedToday;
  }

  /** 🎥 Enciende la cámara (solo web) */
  async startCamera() {
    if (this.trainedToday) {
      // Si ya entrenó hoy, no iniciamos cámara para evitar confusión
      return;
    }

    // En nativo no usamos getUserMedia, solo plugin
    if (this.isNative) return;

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
      console.warn('No se pudo iniciar la cámara (web):', err);
    }
  }

  /** ⏹️ Apaga la cámara (web) */
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

    // Si ya hay foto → rehacer
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

  /** 🧱 Captura frame en canvas → dataURL (web) */
  takePhotoWeb() {
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

  /** 📸 Foto en APK (Android / iOS) con permisos nativos */
  async takePhotoNative() {
    try {
      // Pedir permisos de cámara
      await Camera.requestPermissions({
        permissions: ['camera']
      });

      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl, // seguimos usando photoDataUrl
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true
      });

      this.photoDataUrl = photo.dataUrl || null;
    } catch (err) {
      console.warn('No se pudo tomar la foto (nativo) o el usuario canceló:', err);
    }
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
      await this.firebaseSvc.addTrainingEvidence(
        this.profileId,
        this.activityId,
        fotoUrl
      );

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

  /** 🔊 Audio (web + APK) */
  async speakCard() {
    const text = this.trainedToday
      ? '¡Excelente! Ya registraste el entrenamiento de hoy.'
      : `¡Qué bien lo hicieron! Ahora toma una foto de ${this.petName}.`;

    await this.speak(text);
  }

  /** 🔊 Función genérica para hablar */
  private async speak(text: string) {
    if (!text) return;

    const isNative = this.isNative;

    if (!isNative) {
      // Web Speech API (navegador)
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      (window as any).speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      utter.rate = 0.95;

      (window as any).speechSynthesis.speak(utter);
    } else {
      // Plugin nativo para APK
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({
          text,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient'
        });
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
      }
    }
  }

  /** 💬 Toast helper */
  private async showToast(message: string) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await t.present();
  }
}
