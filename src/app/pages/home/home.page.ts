import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Router, RouterModule } from '@angular/router';
import {
  checkmarkOutline,
  homeOutline,
  heartOutline,
  personOutline,
  volumeHighOutline,
  volumeHigh
} from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { FirebaseService } from '../../services/firebase';
import { Observable } from 'rxjs';
import { Profile } from '../../models/profile.model';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonButton, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  profile$: Observable<Profile | null>;
  profileId: string | null = null;

  childName = '...';
  dogName = 'tu pelusa';

  progreso = {
    comida: { done: 0, total: 2 },
    paseos: { done: 0, total: 2 },
    entreno: { done: 0, total: 1 },
    limpieza: { done: 0 },
    vacunas: { done: 0 },
    score: 0,
    bonus: 0
  };

  /** 👇 NUEVO: estado del audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private router: Router,
    private session: SessionService,
    private firebase: FirebaseService
  ) {
    addIcons({
      checkmarkOutline,
      homeOutline,
      heartOutline,
      personOutline,
      volumeHighOutline,
      volumeHigh
    });

    this.profile$ = this.session.profile$;
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (profile) {
      this.childName = profile.nombreNino || '...';
      this.dogName = profile.nombrePerro || 'tu pelusa';
    }

    if (profile?.id) {
      this.profileId = profile.id;
      await this.loadProgress();
    }
  }

  ionViewWillEnter() {
    if (this.profileId) {
      this.loadProgress();
    }
  }

  /** 👇 NUEVO: cuando sales de la vista, corta el audio */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  /** 🔁 Cargar progreso y calcular bonus semanal */
  async loadProgress() {
    if (!this.profileId) return;

    // 🦴 Comida
    const { morningFed, eveningFed } =
      await this.firebase.getDailyFeedStatus(this.profileId);
    this.progreso.comida.done = [morningFed, eveningFed].filter(Boolean).length;

    // 🐾 Paseos
    const { morningWalked, eveningWalked } =
      await this.firebase.getDailyWalkStatus(this.profileId);
    this.progreso.paseos.done = [morningWalked, eveningWalked].filter(Boolean).length;

    // 🎮 Entrenamiento
    const { trainedToday } =
      await this.firebase.getDailyTrainingStatus(this.profileId);
    this.progreso.entreno.done = trainedToday ? 1 : 0;

    // 🛁 Limpieza
    const { hasBath } = await this.firebase.getBathStatus(this.profileId);
    this.progreso.limpieza.done = hasBath ? 1 : 0;

    // 💉 Vacunas
    const { hasVaccine } = await this.firebase.getVaccineStatus(this.profileId);
    this.progreso.vacunas.done = hasVaccine ? 1 : 0;

    const totalActividades = 3;
    const promedio =
      (this.progreso.comida.done / this.progreso.comida.total +
        this.progreso.paseos.done / this.progreso.paseos.total +
        this.progreso.entreno.done / this.progreso.entreno.total) /
      totalActividades;

    let baseScore = promedio * 100;

    const bonusCount =
      (this.progreso.limpieza.done ? 1 : 0) +
      (this.progreso.vacunas.done ? 1 : 0);

    const bonus = Math.min(bonusCount * 5, 10);
    this.progreso.bonus = bonus;

    const total = Math.min(baseScore + bonus, 100);
    this.progreso.score = Math.round(total);
  }

  /** 🗣 Texto completo del botón de arriba */
  private buildMainAudioText(): string {
    const comida = this.progreso.comida.done;
    const paseos = this.progreso.paseos.done;
    const entreno = this.progreso.entreno.done;
    const estadoTexto = 'Good';
    const score = this.progreso.score;

    return `Hola ${this.childName}. ¿Cómo está ${this.dogName} hoy?.
Comida ${comida}. Paseos ${paseos}. Entrenamiento ${entreno}. ${estadoTexto} ${score} por ciento.`;
  }

  /** 👉 Botón de audio superior — ahora toggle */
  async onMainAudio() {
    const text = this.buildMainAudioText();
    await this.toggleSpeech(text);
  }

  /** 👇 NUEVO: lógica toggle (play / stop) */
  private async toggleSpeech(text: string) {
    if (!text) return;

    // Si ya está hablando, al volver a tocar se detiene
    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    // Si no está hablando, empieza
    await this.speak(text);
  }

  /** 👉 Cuando tocan las pills: dice la palabra y navega */
  async onPillClick(path: string, word: string) {
    // opcional: corta cualquier audio anterior antes de hablar
    this.stopSpeech();
    await this.speak(word);
    this.router.navigateByUrl(path);
  }

  /** 🔊 Hablar (web y nativo) */
  private async speak(text: string) {
    if (!text) return;

    const isNative = Capacitor.isNativePlatform();
    this.isSpeaking = true; // 👈 marcamos que está hablando

    if (!isNative) {
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        this.isSpeaking = false;
        return;
      }

      (window as any).speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;

      // 👇 Cuando termina o hay error, marcamos que ya no está hablando
      utterance.onend = () => {
        if (this.currentUtterance === utterance) {
          this.isSpeaking = false;
          this.currentUtterance = null;
        }
      };

      utterance.onerror = () => {
        if (this.currentUtterance === utterance) {
          this.isSpeaking = false;
          this.currentUtterance = null;
        }
      };

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
      } finally {
        // En nativo no tenemos evento onend, así que liberamos aquí
        this.isSpeaking = false;
      }
    }
  }

  /** 🧹 Detener lectura en cualquier plataforma */
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
}
