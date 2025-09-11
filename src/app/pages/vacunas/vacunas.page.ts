import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonImg,
  IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  addOutline
} from 'ionicons/icons';

interface VaccinationForm {
  tipo: string | null;
  fechaVacunacion: string | null;  // ISO yyyy-MM-dd
  fechaRefuerzo: string | null;    // ISO yyyy-MM-dd
}

@Component({
  selector: 'app-vacunas',
  templateUrl: './vacunas.page.html',
  styleUrls: ['./vacunas.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonInput,
    CommonModule,
    IonImg,
    FormsModule
  ]
})
export class VacunasPage implements OnInit {

  userName = 'Mary';
  petName  = 'Pelusa';

  vacunas = [
    'Antirrábica',
    'Parvovirus',
    'Moquillo',
    'Hepatitis (Adenovirus)',
    'Leptospirosis',
    'Parainfluenza',
    'Polivalente (Quíntuple/Séxtuple)'
  ];

  form: VaccinationForm = {
    tipo: null,
    fechaVacunacion: null,
    fechaRefuerzo: null
  };

  constructor() {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      addOutline
    });
  }

  ngOnInit() {}

  speakCard() {
    const text =
      `${this.petName} necesita sus vacunas. ` +
      `Marca cuál fue la vacuna que recibió, la fecha en que se la pusieron y el día de su refuerzo.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        synth.cancel();
        synth.speak(utter);
      }
    } catch { /* no-op */ }
  }

  /** Garantiza que el modelo se actualice al seleccionar una fecha */
  onDateChange(
    field: 'fechaVacunacion' | 'fechaRefuerzo',
    ev: CustomEvent
  ) {
    const val = (ev as any)?.detail?.value ?? null;
    this.form[field] = typeof val === 'string' ? val : null;
  }

  addRecord() {
    console.log('Agregar registro de vacuna', this.form);
    // reset
    this.form = { tipo: null, fechaVacunacion: null, fechaRefuerzo: null };
  }
}
