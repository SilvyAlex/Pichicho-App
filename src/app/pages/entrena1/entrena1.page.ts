import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonImg
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  chevronForwardOutline,
  constructOutline
} from 'ionicons/icons';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';

@Component({
  selector: 'app-entrena1',
  templateUrl: './entrena1.page.html',
  styleUrls: ['./entrena1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonImg
  ]
})
export class Entrena1Page implements OnInit, OnDestroy {
  @ViewChild('scroller') scroller!: ElementRef;

  petName = 'Pichicho';
  activities: any[] = [];
  progress = 0;
  trainedToday = false;
  completedActivityId: string | null = null;

  profileId = '';

  /** 🔊 Estado de audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private session: SessionService
  ) {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      chevronForwardOutline,
      constructOutline
    });
  }

  async ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.petName = profile.nombrePerro;
      this.profileId = profile.id!;
    } else {
      this.profileId = localStorage.getItem('profileId') || '';
    }

    this.activities = await this.firebase.getEntrenamientos();
    await this.checkTrainingStatus();
  }

  async ionViewWillEnter() {
    await this.checkTrainingStatus();
  }

  /** 🚪 Al salir de la vista, corta el audio */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  async checkTrainingStatus() {
    if (!this.profileId) {
      console.warn(
        'No hay profileId en Entrena1, no se puede revisar entrenamiento diario'
      );
      return;
    }

    const status = await this.firebase.getDailyTrainingStatus(this.profileId);
    this.trainedToday = status.trainedToday;
    this.completedActivityId = status.activityId || null;
    this.progress = status.trainedToday ? 1 : 0;
  }

  /** 🔊 Botón de audio de la pantalla (toggle) */
  async speakCard() {
    const text = `Entrenamiento. Hora de enseñarle trucos a ${this.petName}. 
Escoge qué quieres practicar hoy. Recuerda premiarlo por un buen trabajo.`;
    await this.toggleSpeech(text);
  }

  /** 👉 Cuando el niño toca una actividad */
  async onActivityClick(a: any) {
    if (this.trainedToday && this.completedActivityId !== a.id) {
      return;
    }

    const nombre = a?.titulo || 'actividad';

    // Cortar cualquier audio que esté sonando antes de decir el nombre
    this.stopSpeech();
    await this.speak(nombre);

    if (!this.trainedToday) {
      this.router.navigate(['/entrena2', a.id]);
    }
  }

  scrollNext() {
    if (this.scroller?.nativeElement) {
      this.scroller.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }

  /* ================================
     AUDIO (toggle + control)
  ===================================*/

  private async toggleSpeech(text: string) {
    if (!text) return;

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    await this.speak(text);
  }

  /** 🔊 Función genérica para hablar (web + APK) */
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
}
