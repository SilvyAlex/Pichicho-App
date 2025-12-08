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
  IonSegmentButton,
  IonImg,
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
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

type WalkTime = 'dia' | 'tarde';

@Component({
  selector: 'app-paseos1',
  templateUrl: './paseos1.page.html',
  styleUrls: ['./paseos1.page.scss'],
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
    IonImg,
    FormsModule
  ]
})
export class Paseos1Page implements OnInit, OnDestroy {
  userName = '';
  petName = '';
  profileId = '';
  time: WalkTime = 'dia';
  currentPeriod: 'morning' | 'evening' | 'none' = 'none';
  morningWalked = false;
  eveningWalked = false;
  progress = 0;
  isDisabled = true;

  /** 🔊 Estado del audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private router: Router,
    private session: SessionService,
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
    }

    this.detectPeriod();
    await this.loadDailyWalkStatus();
  }

  /** 🚪 Al salir de la vista, cortar audio */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  /** 🔍 Detectar horario */
  detectPeriod() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      this.time = 'dia';
      this.currentPeriod = 'morning';
    } else if (hour >= 12 && hour < 22) {
      this.time = 'tarde';
      this.currentPeriod = 'evening';
    } else {
      this.time = 'dia';
      this.currentPeriod = 'none';
    }
  }

  /** 📅 Cargar progreso diario de paseos */
  async loadDailyWalkStatus() {
    if (!this.profileId) return;
    const { morningWalked, eveningWalked } = await this.firebase.getDailyWalkStatus(this.profileId);
    this.morningWalked = morningWalked;
    this.eveningWalked = eveningWalked;
    this.progress = [morningWalked, eveningWalked].filter(Boolean).length;

    if (
      (this.currentPeriod === 'morning' && this.morningWalked) ||
      (this.currentPeriod === 'evening' && this.eveningWalked) ||
      this.currentPeriod === 'none'
    ) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }

  /** 🚶 Iniciar paseo (redirige a Paseos2) */
  async walkDog() {
    if (this.isDisabled) return;

    // Por si está hablando, paramos audio
    this.stopSpeech();

    await this.showToast(`¡${this.petName} está listo para su paseo! 🐾`);
    this.router.navigateByUrl('/paseos2');
  }

  /** 🗣 Texto que debe leer el botón de audio */
  private buildCardText(): string {
    let text =
      `Vamos a caminar con ${this.petName || 'tu perrito'}. ` +
      `Recuerda que los paseos lo mantienen sano y contento. ` +
      `También es tu momento para moverte y divertirte.`;

    if (this.currentPeriod === 'none') {
      text +=
        ' En este momento no es hora de paseo. Los horarios son: por la mañana de cuatro a once, y por la tarde de doce del día a diez de la noche.';
    }

    return text;
  }

  /** 🔊 Reproducir audio (toggle) */
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

  /** 💬 Toast */
  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
