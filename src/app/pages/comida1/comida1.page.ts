import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonImg,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  pawOutline
} from 'ionicons/icons';

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
export class Comida1Page implements OnInit {
  // Datos fijos de la UI
  userName = 'Mary';
  petName = 'Pelusa';
  scoops = 2;
  currentWeightKg = 20;

  // Segmento seleccionado
  time: FeedTime = 'noche'; // por defecto Noche

  constructor() {
    // Registrar íconos que usamos
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      pawOutline
    });
  }

  ngOnInit() {}

  handleSegmentChange(ev: CustomEvent) {
    this.time = (ev.detail.value as FeedTime) || 'dia';
  }

  speakCard() {
    const text = `Hola ${this.userName}. Hoy ${this.petName} necesita ${this.scoops} scoops de croquetas para estar fuerte y feliz.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        synth.cancel();
        synth.speak(utter);
      }
    } catch {
      console.warn('Speech synthesis no disponible en este dispositivo');
    }
  }

  feedNow() {
    console.log('¡Darle de comer!', {
      time: this.time,
      weightKg: this.currentWeightKg,
      scoops: this.scoops
    });
  }
}
