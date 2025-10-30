import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonImg
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';
import { FeedingService, FeedingResult } from '../../services/feeding.service';

@Component({
  selector: 'app-paseos2',
  templateUrl: './paseos2.page.html',
  styleUrls: ['./paseos2.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    CommonModule,
    FormsModule,
    IonImg
  ]
})
export class Paseos2Page implements OnInit, OnDestroy {
  userName = '';
  petName = '';

  feeding: FeedingResult = { grams: 0, scoops: 0, paseo: 0, edadHumana: '-' };

  private durationSec = 0;
  remainingSec = 0;
  displayTime = '0:00';
  private timerId: any = null;
  running = false;
  finished = false;

  constructor(
    private router: Router,
    private session: SessionService,
    private feedingSvc: FeedingService
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.feeding = this.feedingSvc.calculate(profile);

      // Tiempo recomendado de paseo en minutos convertido a segundos
      this.durationSec = this.feeding.paseo * 60;
      this.remainingSec = this.durationSec;
      this.updateDisplay();
      this.startTimer();
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private startTimer() {
    if (this.running) return;
    this.running = true;
    this.finished = false;

    this.timerId = setInterval(() => {
      this.remainingSec = Math.max(0, this.remainingSec - 1);
      this.updateDisplay();

      if (this.remainingSec === 0) {
        this.finishWalk();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.running = false;
  }

  private updateDisplay() {
    const m = Math.floor(this.remainingSec / 60);
    const s = this.remainingSec % 60;
    this.displayTime = `${m}:${s.toString().padStart(2, '0')}`;
  }

  finishWalk() {
    this.clearTimer();
    this.finished = true;
    console.log('Paseo finalizado');

    // 🔹 Navegar automáticamente a la siguiente vista
    setTimeout(() => {
      this.router.navigateByUrl('/paseos3');
    }, 1000);
  }

  speakCard() {
    const text = `¡Paseo en curso! Aprovecha este tiempo para que ${this.petName} explore y juegue. No olvides recoger sus desechos con una fundita.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        synth.cancel();
        synth.speak(u);
      }
    } catch {
      // no-op
    }
  }

  onEndPress() {
    if (!this.finished) {
      this.finishWalk();
    }
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
