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
  IonImg,
  IonSegmentButton,
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
import { FeedingService, FeedingResult } from '../../services/feeding.service';

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
  userName = '';
  petName = '';
  profileId = '';
  feeding: FeedingResult = { grams: 0, scoops: 0, paseo: 0, edadHumana: '-' };

  time: FeedTime = 'dia';
  currentPeriod: 'morning' | 'evening' | 'none' = 'none';
  morningFed = false;
  eveningFed = false;
  isDisabled = true;
  progress = 0;

  constructor(
    private router: Router,
    private session: SessionService,
    private feedingSvc: FeedingService,
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
      this.feeding = this.feedingSvc.calculate(profile);
    }

    this.detectPeriod();
    await this.loadDailyFeedStatus();
  }

  /** 🔍 Detectar horario y actualizar segmento */
  detectPeriod() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      this.time = 'dia';
      this.currentPeriod = 'morning';
    } else if (hour >= 12 && hour < 22) {
      this.time = 'noche';
      this.currentPeriod = 'evening';
    } else {
      this.time = 'dia';
      this.currentPeriod = 'none';
    }
  }

  /** 📅 Cargar progreso diario */
  async loadDailyFeedStatus() {
    if (!this.profileId) return;
    const { morningFed, eveningFed } = await this.firebase.getDailyFeedStatus(this.profileId);
    this.morningFed = morningFed;
    this.eveningFed = eveningFed;
    this.progress = [morningFed, eveningFed].filter(Boolean).length;

    // Desactivar fuera de hora o si ya alimentó
    if (
      (this.currentPeriod === 'morning' && this.morningFed) ||
      (this.currentPeriod === 'evening' && this.eveningFed) ||
      this.currentPeriod === 'none'
    ) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }

  /** 🦴 Acción alimentar */
  async feedDog() {
    if (this.isDisabled) return;

    // Mostrar mensaje motivador
    await this.showToast(`¡${this.petName} está feliz y comiendo! 🦴`);

    // Redirigir a Comida2 para tomar la foto
    this.router.navigateByUrl('/comida2');
  }

  /** 🎙️ Voz */
  speakCard() {
    const text = `Hola ${this.userName}. Hoy ${this.petName} necesita ${this.feeding.scoops} scoops, es decir ${this.feeding.grams} gramos de croquetas.`;
    const synth = (window as any).speechSynthesis;
    if (synth) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      synth.cancel();
      synth.speak(utter);
    }
  }

  /** 📣 Toast */
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
