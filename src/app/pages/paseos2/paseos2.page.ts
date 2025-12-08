import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonImg
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';
import { FeedingService, FeedingResult } from '../../services/feeding.service';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Component({
  selector: 'app-paseos2',
  templateUrl: './paseos2.page.html',
  styleUrls: ['./paseos2.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    CommonModule,
    FormsModule,
    IonImg
  ]
})
export class Paseos2Page implements OnInit, OnDestroy {
  userName = '';
  petName = '';

  feeding: FeedingResult = { grams: 0, scoops: 0, paseo: 0, edadHumana: '-' };

  private durationSec = 0;
  remainingSec = 0;
  displayTime = '0:00';
  private timerId: any = null;
  running = false;
  finished = false;

  /** 🔊 Estado de audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private router: Router,
    private session: SessionService,
    private feedingSvc: FeedingService
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.feeding = this.feedingSvc.calculate(profile);

      // Tiempo recomendado de paseo en minutos convertido a segundos
      this.durationSec = this.feeding.paseo * 60;
      this.remainingSec = this.durationSec;
      this.updateDisplay();
      this.startTimer();
    }
  }

  /** 🚪 Al salir de la vista, cortar audio y timer */
  ionViewWillLeave() {
    this.stopSpeech();
    this.clearTimer();
  }

  ngOnDestroy() {
    this.stopSpeech();
    this.clearTimer();
  }

  private startTimer() {
    if (this.running || this.durationSec <= 0) return;
    this.running = true;
    this.finished = false;

    this.timerId = setInterval(() => {
      this.remainingSec = Math.max(0, this.remainingSec - 1);
      this.updateDisplay();

      if (this.remainingSec === 0) {
        this.finishWalk();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.running = false;
  }

  private updateDisplay() {
    const m = Math.floor(this.remainingSec / 60);
    const s = this.remainingSec % 60;
    this.displayTime = `${m}:${s.toString().padStart(2, '0')}`;
  }

  finishWalk() {
    this.clearTimer();
    this.finished = true;
    this.stopSpeech(); // por si estaba hablando
    console.log('Paseo finalizado');

    // 🔹 Navegar automáticamente a la siguiente vista
    setTimeout(() => {
      this.router.navigateByUrl('/paseos3');
    }, 1000);
  }

  /** 🗣 Texto que debe leer el botón de audio */
  private buildCardText(): string {
    return (
      `Paseo en curso. Aprovecha este tiempo para que ${this.petName || 'tu perrito'} ` +
      `explore y juegue. No olvides recoger sus desechos con una fundita.`
    );
  }

  /** 🔊 Botón de audio (toggle) */
  async speakCard() {
    const text = this.buildCardText();
    await this.toggleSpeech(text);
  }

  /** 🎛️ Lógica toggle (play / stop) */
  private async toggleSpeech(text: string) {
    if (!text.trim()) return;

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    await this.speak(text);
  }

  /** 🔊 Hablar (web + nativo) */
  private async speak(text: string) {
    if (!text.trim()) return;

    const isNative = Capacitor.isNativePlatform();
    this.isSpeaking = true;

    if (!isNative) {
      // Web (localhost / navegador) → Web Speech API
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        this.isSpeaking = false;
        return;
      }

      try {
        const synth = (window as any).speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance(text);
        this.currentUtterance = u;
        u.lang = 'es-ES';
        u.rate = 0.95;

        u.onend = () => {
          if (this.currentUtterance === u) {
            this.isSpeaking = false;
            this.currentUtterance = null;
          }
        };

        u.onerror = () => {
          if (this.currentUtterance === u) {
            this.isSpeaking = false;
            this.currentUtterance = null;
          }
        };

        synth.speak(u);
      } catch (e) {
        console.warn('No se pudo reproducir la locución:', e);
        this.isSpeaking = false;
      }
    } else {
      // APK (Android / iOS) → Plugin nativo de TTS
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
      } finally {
        this.isSpeaking = false;
      }
    }
  }

  /** 🧹 Detener lectura */
  private stopSpeech() {
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      if ('speechSynthesis' in window) {
        (window as any).speechSynthesis.cancel();
      }
    } else {
      TextToSpeech.stop().catch(() => {});
    }

    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  onEndPress() {
    if (!this.finished) {
      this.finishWalk();
    }
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
