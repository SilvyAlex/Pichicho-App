import { Component, OnInit } from '@angular/core';
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
export class Entrena2Page implements OnInit {
  data: any = null;
  profileId = localStorage.getItem('profileId') || '';

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

  /** 🔊 Botón de audio: título + descripción + pasos */
  async speakCard() {
    if (!this.data) return;

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

    const text = [titulo, descripcion, pasosText].filter(Boolean).join(' ');

    await this.speak(text);
  }

  /** 🔊 Función genérica para hablar (web + nativo) */
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
          volume: 1.0,   // volumen alto para APK
          category: 'ambient'
        });
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
      }
    }
  }

  async finishTraining() {
    if (!this.profileId || !this.data) return;

    await this.firebase.addTrainingEvidence(
      this.profileId,
      this.data.id || 'sin_id'
    );

    const alert = await this.alertCtrl.create({
      header: '¡Buen trabajo!',
      message: 'Has completado el entrenamiento de hoy y ganaste 15 puntos 🦴',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.router.navigate(['/entrena1']);
          }
        }
      ]
    });

    await alert.present();
  }
}
