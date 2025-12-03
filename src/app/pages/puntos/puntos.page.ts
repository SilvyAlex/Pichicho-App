import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonImg, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  homeOutline,
  heartOutline,
  personOutline
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-puntos',
  templateUrl: './puntos.page.html',
  styleUrls: ['./puntos.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonImg, IonButton, CommonModule, RouterModule]
})
export class PuntosPage implements OnInit, OnDestroy {

  petName = '';
  porcentajeSemanal = 0;
  porcentajeHoy = 0; // porcentaje del día actual
  colorActual = '#22c55e';
  shown = 0;
  radius = 62;
  stroke = 14;

  gradStrokeId = 'gStroke' + Math.random().toString(36).slice(2);
  gradTrackId  = 'gTrack'  + Math.random().toString(36).slice(2);
  glowId       = 'fGlow'   + Math.random().toString(36).slice(2);

  feedbackMessage = '';
  feedbackMedia = '';

  get center() { return this.radius + this.stroke; }
  get circumference() { return 2 * Math.PI * this.radius; }
  get dashOffset() { return this.circumference * (1 - this.shown / 100); }
  get endAngle() { return (this.shown / 100) * 2 * Math.PI - Math.PI / 2; }
  get endX() { return this.center + this.radius * Math.cos(this.endAngle); }
  get endY() { return this.center + this.radius * Math.sin(this.endAngle); }

  dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  dayValues: number[] = new Array(7).fill(0);
  dayColors: string[] = new Array(7).fill('#e5e7eb');

  constructor(
    private firebase: FirebaseService,
    private session: SessionService
  ) {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      homeOutline,
      heartOutline,
      personOutline
    });
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (!profile) return;

    this.petName = profile.nombrePerro;
    await this.loadWeeklyProgress(profile.id);
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  /** 📅 Calcula el progreso total de la semana */
  async loadWeeklyProgress(profileId: string) {
    const today = new Date();
    const startOfWeek = this.getMonday(today);
    const dailyPercents: number[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const percent = await this.getDayPerformance(profileId, date);
      dailyPercents.push(percent);

      if (this.sameDate(today, date)) this.porcentajeHoy = percent;
    }

    const totalSemanal = dailyPercents.reduce((a, b) => a + b, 0) / 7;
    this.porcentajeSemanal = Math.round(totalSemanal);

    // Color del donut
    if (this.porcentajeSemanal <= 45) this.colorActual = '#ef4444';
    else if (this.porcentajeSemanal <= 79) this.colorActual = '#facc15';
    else this.colorActual = '#22c55e';

    this.animateTo(this.porcentajeSemanal, 900);

    this.dayValues = dailyPercents;
    this.dayColors = dailyPercents.map(v =>
      v <= 45 ? '#ef4444' : v <= 79 ? '#facc15' : '#22c55e'
    );

    this.updateFeedback();
  }

  /** 💬 Cambia el mensaje e imagen/video según porcentaje del día */
  updateFeedback() {
    if (this.porcentajeHoy < 50) {
      this.feedbackMessage = 'Debes prestarle más atención a tu mascota para que esté feliz';
      this.feedbackMedia = 'assets/images/NoDog.png';
    } else {
      this.feedbackMessage = '¡Tu mascota está feliz! Buen trabajo';
      this.feedbackMedia = 'assets/images/SiDog.png';
    }
  }

  private async getDayPerformance(profileId: string, date: Date): Promise<number> {
    try {
      const feed = await this.firebase.getDailyFeedStatus(profileId, date);
      const walk = await this.firebase.getDailyWalkStatus(profileId, date);
      const train = await this.firebase.getDailyTrainingStatus(profileId, date);

      const comidaDone = [feed.morningFed, feed.eveningFed].filter(Boolean).length;
      const paseosDone = [walk.morningWalked, walk.eveningWalked].filter(Boolean).length;
      const entrenoDone = train.trainedToday ? 1 : 0;

      let base =
        ((comidaDone / 2) + (paseosDone / 2) + (entrenoDone / 1)) / 3 * 100;

      const today = new Date();
      if (this.sameDate(today, date)) {
        const { hasBath } = await this.firebase.getBathStatus(profileId);
        const { hasVaccine } = await this.firebase.getVaccineStatus(profileId);
        const bonus = (hasBath ? 5 : 0) + (hasVaccine ? 5 : 0);
        base = Math.min(base + bonus, 100);
      }
      return base;
    } catch {
      return 0;
    }
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private sameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private animateTo(value: number, duration = 800) {
    const start = performance.now();
    const from = this.shown;
    const delta = value - from;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      this.shown = +(from + delta * ease(p)).toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** 🗣 Texto que leerá el botón de audio */
  private buildMainAudioText(): string {
    const titulo = 'Mira tu progreso';
    const resp = `Tu responsabilidad es del ${Math.round(this.porcentajeSemanal)} por ciento.`;

    const headline = this.porcentajeHoy < 50 ? '¡Ups!' : '¡Increíble!';
    const mensaje = this.feedbackMessage || '';

    return `${titulo}. ${resp} ${headline}. ${mensaje}`;
  }

  /** 👉 Botón de audio superior */
  async onMainAudio() {
    const text = this.buildMainAudioText();
    await this.speak(text);
  }

  /** 🔊 Hablar (web y nativo) */
  private async speak(text: string) {
    if (!text) return;

    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      (window as any).speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;

      (window as any).speechSynthesis.speak(utterance);
    } else {
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

  /** 🧹 Detener lectura al salir */
  private stopSpeech() {
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      if ('speechSynthesis' in window) {
        (window as any).speechSynthesis.cancel();
      }
    } else {
      TextToSpeech.stop().catch(() => {});
    }
  }
}
