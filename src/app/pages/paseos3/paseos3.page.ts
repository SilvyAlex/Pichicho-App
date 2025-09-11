import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  cameraOutline
} from 'ionicons/icons';

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
    //IonImg,
    CommonModule,
    FormsModule]
})
export class Paseos3Page implements OnInit {

  userName = 'Mary';
  petName  = 'Pelusa';

  @ViewChild('video')  videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;

  isStreaming = false;       // cámara encendida
  photoDataUrl: string | null = null; // foto capturada

  constructor() {
    addIcons({ chevronBackOutline, volumeHighOutline, cameraOutline });
  }

  ngOnInit() {}

  async ngAfterViewInit() {
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  /** Enciende la cámara (trasera si está disponible) */
  async startCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn('getUserMedia no disponible');
        return;
      }
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

  /** Dispara o rehace la foto según el estado */
  async onShutter() {
    if (this.photoDataUrl) {
      // Repetir: borrar foto y reactivar cámara
      this.photoDataUrl = null;
      await this.startCamera();
      return;
    }
    this.takePhoto();
  }

  /** Captura la imagen del video en un canvas */
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

    // apagar cámara para liberar recursos
    this.stopCamera();
  }

  /** Lee el texto con Web Speech API (si existe) */
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
    } catch { /* no-op */ }
  }

}
