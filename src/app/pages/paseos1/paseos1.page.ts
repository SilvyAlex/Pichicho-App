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
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  pawOutline
} from 'ionicons/icons';

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
    FormsModule
  ]
})
export class Paseos1Page implements OnInit {

  userName = 'Mary';
  petName  = 'Pelusa';

  // Segmento seleccionado
  time: WalkTime = 'tarde'; // como en tu mock

  constructor() {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      pawOutline
    });
  }

  ngOnInit() {}

  handleSegmentChange(ev: CustomEvent) {
    this.time = (ev.detail.value as WalkTime) || 'dia';
  }

  speakCard() {
    const text = `Vamos a caminar con ${this.petName}. Recuerda que los paseos lo mantienen sano y contento. ¡También es tu momento para moverte y divertirte!`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        synth.cancel();
        synth.speak(utter);
      }
    } catch {
      console.warn('Speech synthesis no disponible.');
    }
  }

  startWalk() {
    console.log('Empezar paseo', { time: this.time, pet: this.petName });
  }
}
