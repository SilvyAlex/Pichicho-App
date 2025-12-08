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
  IonSegment,
  IonImg,
  IonSegmentButton,
  IonLabel,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  pawOutline
} from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { FirebaseService } from '../../services/firebase';
import { Profile } from '../../models/profile.model';
import { FeedingService, FeedingResult } from '../../services/feeding.service';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

type FeedTime = 'dia' | 'noche';

@Component({
  selector: 'app-comida1',
  templateUrl: './comida1.page.html',
  styleUrls: ['./comida1.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    CommonModule,
    FormsModule,
    IonImg
  ]
})
export class Comida1Page implements OnInit, OnDestroy {
  userName = '';
  petName = '';
  profileId = '';
  feeding: FeedingResult = { grams: 0, scoops: 0, paseo: 0, edadHumana: '-' };

  time: FeedTime = 'dia';
  currentPeriod: 'morning' | 'evening' | 'none' = 'none';
  morningFed = false;
  eveningFed = false;
  isDisabled = true;
  progress = 0;

  /** 👇 NUEVO: estado del audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private router: Router,
    private session: SessionService,
    private feedingSvc: FeedingService,
    private firebase: FirebaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, pawOutline });
  }

  async ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.profileId = profile.id!;
      this.feeding = this.feedingSvc.calculate(profile);
    }

    this.detectPeriod();
    await this.loadDailyFeedStatus();
  }

  /** 👇 Al salir de la vista, cortamos el audio */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  /** 🔍 Detectar horario y actualizar segmento */
  detectPeriod() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      this.time = 'dia';
      this.currentPeriod = 'morning';
    } else if (hour >= 12 && hour < 22) {
      this.time = 'noche';
      this.currentPeriod = 'evening';
    } else {
      this.time = 'dia';
      this.currentPeriod = 'none';
    }
  }

  /** 📅 Cargar progreso diario */
  async loadDailyFeedStatus() {
    if (!this.profileId) return;
    const { morningFed, eveningFed } =
      await this.firebase.getDailyFeedStatus(this.profileId);

    this.morningFed = morningFed;
    this.eveningFed = eveningFed;
    this.progress = [morningFed, eveningFed].filter(Boolean).length;

    if (
      (this.currentPeriod === 'morning' && this.morningFed) ||
      (this.currentPeriod === 'evening' && this.eveningFed) ||
      this.currentPeriod === 'none'
    ) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }

  /** 🦴 Acción alimentar */
  async feedDog() {
    if (this.isDisabled) return;

    // Detenemos audio por si está hablando
    this.stopSpeech();

    await this.showToast(`¡${this.petName} está feliz y comiendo! 🦴`);

    // Redirigir a Comida2 para tomar la foto
    this.router.navigateByUrl('/comida2');
  }

  /** 🎙️ Texto de la tarjeta */
  private buildCardText(): string {
    let text = `Hola ${this.userName}. Hoy ${this.petName} necesita ${this.feeding.scoops} scoops, es decir ${this.feeding.grams} gramos de croquetas para estar fuerte y feliz.`;

    if (this.currentPeriod === 'none') {
      text +=
        ' En este momento no es hora de comida. Los horarios son: por la mañana de cuatro a once, y por la tarde de doce del día a diez de la noche.';
    }

    return text;
  }

  /** 🎙️ Botón de audio — ahora toggle */
  async speakCard() {
    const text = this.buildCardText();
    await this.toggleSpeech(text);
  }

  /** 👇 NUEVO: lógica toggle (play / stop) */
  private async toggleSpeech(text: string) {
    if (!text.trim()) return;

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    await this.speak(text);
  }

  /** 🔊 Hablar (web y nativo) */
  private async speak(text: string) {
    if (!text.trim()) return;

    const isNative = Capacitor.isNativePlatform();
    this.isSpeaking = true;

    if (!isNative) {
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

        const utter = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utter;
        utter.lang = 'es-ES';
        utter.rate = 0.95;

        utter.onend = () => {
          if (this.currentUtterance === utter) {
            this.isSpeaking = false;
            this.currentUtterance = null;
          }
        };

        utter.onerror = () => {
          if (this.currentUtterance === utter) {
            this.isSpeaking = false;
            this.currentUtterance = null;
          }
        };

        synth.speak(utter);
      } catch (e) {
        console.warn('No se pudo reproducir la locución:', e);
        this.isSpeaking = false;
      }
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
        // En nativo no tenemos onend fiable
        this.isSpeaking = false;
      }
    }
  }

  /** 🧹 Detener cualquier audio activo */
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

  /** 📣 Toast */
  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  continue(path: string) {
    this.stopSpeech();
    this.router.navigateByUrl(path);
  }
}
