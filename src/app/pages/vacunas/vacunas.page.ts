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
  addOutline,
  checkmarkOutline
} from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';
import { ToastController } from '@ionic/angular';

interface VaccineRecord {
  tipo: string | null;
  fechaVacunacion: string | null;
  fechaRefuerzo: string | null;
  saved?: boolean; // si ya fue guardado en Firebase
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
    FormsModule
  ]
})
export class VacunasPage implements OnInit {
  userName = '';
  petName = '';

  vacunas = [
    'Antirrábica',
    'Parvovirus',
    'Moquillo',
    'Hepatitis (Adenovirus)',
    'Leptospirosis',
    'Parainfluenza',
    'Polivalente (Quíntuple/Séxtuple)'
  ];

  vaccineList: VaccineRecord[] = []; // array dinámico
  profileId: string | null = null;

  constructor(
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      addOutline,
      checkmarkOutline
    });
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (profile) {
      this.profileId = profile.id;
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      await this.loadVaccineHistory();
    }
  }

  /** Cargar historial existente */
  async loadVaccineHistory() {
    if (!this.profileId) return;
    const vacunas = await this.firebaseSvc.getVaccineHistory(this.profileId);
    this.vaccineList = vacunas.map(v => ({ ...v, saved: true }));
  }

  /** Agregar un nuevo formulario de vacuna vacío */
  addRecord() {
    this.vaccineList.push({
      tipo: null,
      fechaVacunacion: null,
      fechaRefuerzo: null,
      saved: false
    });
  }

  /** Guardar una vacuna específica */
  async saveVaccine(vacuna: VaccineRecord, index: number) {
    if (!this.profileId) return;

    if (!vacuna.tipo || !vacuna.fechaVacunacion || !vacuna.fechaRefuerzo) {
      this.showToast('Completa todos los campos antes de guardar.', 'warning');
      return;
    }

    try {
      await this.firebaseSvc.addVaccine(this.profileId, {
        tipo: vacuna.tipo!,
        fechaVacunacion: vacuna.fechaVacunacion!,
        fechaRefuerzo: vacuna.fechaRefuerzo!
      });

      vacuna.saved = true;
      this.vaccineList[index] = { ...vacuna };
      this.showToast('💉 Vacuna registrada correctamente.', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error al guardar vacuna.', 'danger');
    }
  }

  /** Voz guía */
  speakCard() {
    const text = `${this.petName} necesita sus vacunas. Marca cuál fue la vacuna que recibió, la fecha en que se la pusieron y el día de su refuerzo.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        synth.cancel();
        synth.speak(utter);
      }
    } catch {}
  }

  /** Mensaje visual */
  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1800,
      color,
      position: 'top'
    });
    toast.present();
  }
}
