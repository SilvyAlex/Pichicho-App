import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
export class Entrena1Page implements OnInit {
  @ViewChild('scroller') scroller!: ElementRef;
  petName = 'Pichicho';
  activities: any[] = [];
  progress = 0;
  trainedToday = false;
  completedActivityId: string | null = null;

  profileId = localStorage.getItem('profileId') || ''; // ID del registro del niño

  constructor(
    private firebase: FirebaseService,
    private router: Router
  ) {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      chevronForwardOutline,
      constructOutline
    });
  }

  async ngOnInit() {
    this.activities = await this.firebase.getEntrenamientos();
    await this.checkTrainingStatus();
  }

  async ionViewWillEnter() {
    await this.checkTrainingStatus();
  }

  async checkTrainingStatus() {
    if (!this.profileId) return;
    const status = await this.firebase.getDailyTrainingStatus(this.profileId);
    this.trainedToday = status.trainedToday;
    this.completedActivityId = status.activityId || null;
    this.progress = status.trainedToday ? 1 : 0;
  }

  /** 🔊 Botón de audio de la pantalla */
  async speakCard() {
    const text = `Entrenamiento. Hora de enseñarle trucos a ${this.petName}. 
Escoge qué quieres practicar hoy. Recuerda premiarlo por un buen trabajo.`;
    await this.speak(text);
  }

  /** 👉 Cuando el niño toca una actividad */
  async onActivityClick(a: any) {
    // Si está deshabilitada, no hacemos nada
    if (this.trainedToday && this.completedActivityId !== a.id) {
      return;
    }

    // Decir el nombre del entrenamiento
    const nombre = a?.titulo || 'actividad';
    await this.speak(nombre);

    // Solo navega si aún no ha entrenado hoy
    if (!this.trainedToday) {
      this.router.navigate(['/entrena2', a.id]);
    }
  }

  scrollNext() {
    if (this.scroller?.nativeElement) {
      this.scroller.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }

  /** 🔊 Función genérica para hablar (web + APK) */
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

      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      u.rate = 0.95;

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
      }
    }
  }
}
