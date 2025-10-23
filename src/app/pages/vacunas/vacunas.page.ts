import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  addOutline,
  saveOutline
} from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';
import { ToastController } from '@ionic/angular';

interface VaccineRecord {
  tipo: string | null;
  fechaVacunacion: string | null;
  fechaRefuerzo: string | null;
  saved?: boolean;
  justSaved?: boolean;
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

  vaccineList: VaccineRecord[] = [];
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
      saveOutline
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

  async loadVaccineHistory() {
    if (!this.profileId) return;
    const vacunas = await this.firebaseSvc.getVaccineHistory(this.profileId);
    this.vaccineList = vacunas.map(v => ({ ...v, saved: true }));
  }

  addRecord() {
    this.vaccineList.push({
      tipo: null,
      fechaVacunacion: null,
      fechaRefuerzo: null,
      saved: false
    });
  }

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
      vacuna.justSaved = true;
      this.vaccineList[index] = { ...vacuna };

      setTimeout(() => (vacuna.justSaved = false), 1200);

      this.showToast('💾 Vacuna guardada correctamente.', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error al guardar vacuna.', 'danger');
    }
  }

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
