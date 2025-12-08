import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-entrena2',
  templateUrl: './entrena2.page.html',
  styleUrls: ['./entrena2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon
  ]
})
export class Entrena2Page implements OnInit, OnDestroy {
  data: any = null;
  profileId = localStorage.getItem('profileId') || '';

  /** 🔊 Estado de audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private route: ActivatedRoute,
    private firebase: FirebaseService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  async ngOnInit() {
    const entrenamientoId = this.route.snapshot.paramMap.get('id');
    if (entrenamientoId) {
      this.data = await this.firebase.getEntrenamientoById(entrenamientoId);
    }
  }

  /** 🚪 Cortar audio al salir de la vista */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  /** 🧱 Construir texto de la tarjeta */
  private buildCardText(): string {
    if (!this.data) return '';

    const titulo = this.data.titulo ? `Entrenamiento: ${this.data.titulo}.` : '';
    const descripcion = this.data.descripcion || '';

    let pasosText = '';
    if (Array.isArray(this.data.pasos) && this.data.pasos.length) {
      pasosText =
        'Sigue estos pasos: ' +
        this.data.pasos
          .map((p: string, i: number) => `Paso ${i + 1}: ${p}`)
          .join('. ');
    }

    return [titulo, descripcion, pasosText].filter(Boolean).join(' ');
  }

  /** 🔊 Botón de audio: ahora toggle (play/stop) */
  async speakCard() {
    const text = this.buildCardText();
    await this.toggleSpeech(text);
  }

  private async toggleSpeech(text: string) {
    if (!text) return;

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    await this.speak(text);
  }

  /** 🔊 Función genérica para hablar (web + nativo) */
  private async speak(text: string) {
    if (!text) return;

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

      (window as any).speechSynthesis.cancel();

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

      (window as any).speechSynthesis.speak(u);
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

  async finishTraining() {
    const entrenamientoId = this.route.snapshot.paramMap.get('id');
    if (!entrenamientoId) return;

    // cortar audio antes de navegar
    this.stopSpeech();
    this.router.navigate(['/entrena3', entrenamientoId]);
  }
}
