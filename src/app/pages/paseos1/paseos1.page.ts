import { Component, OnInit } from '@angular/core';
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
export class Paseos1Page implements OnInit {
  userName = '';
  petName = '';
  profileId = '';
  time: WalkTime = 'dia';
  currentPeriod: 'morning' | 'evening' | 'none' = 'none';
  morningWalked = false;
  eveningWalked = false;
  progress = 0;
  isDisabled = true;

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

    await this.showToast(`¡${this.petName} está listo para su paseo! 🐾`);
    // 👇 Aquí solo se navega, no se guarda evidencia
    this.router.navigateByUrl('/paseos2');
  }

  /** 🔊 Reproducir audio */
  speakCard() {
    const text = `Vamos a caminar con ${this.petName}. Recuerda que los paseos lo mantienen sano y contento. ¡También es tu momento para moverte y divertirte!`;
    const synth = (window as any).speechSynthesis;
    if (synth) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      synth.cancel();
      synth.speak(utter);
    }
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
