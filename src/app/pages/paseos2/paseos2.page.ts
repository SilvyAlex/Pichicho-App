import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

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
    FormsModule
  ]
})
export class Paseos2Page implements OnInit, OnDestroy {
  petName = 'Pelusa';

  private durationSec = 7 * 60; // 7 minutos
  remainingSec = this.durationSec;
  displayTime = '7:00';
  private timerId: any = null;
  running = false;
  finished = false;

  constructor(private router: Router) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private startTimer() {
    if (this.running) return;
    this.running = true;
    this.finished = false;
    this.updateDisplay();

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
    // Aquí podrías navegar/guardar métricas/mostrar toast, etc.
    console.log('Paseo finalizado');
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
    } catch { /* no-op */ }
  }

  // Si tocas el botón otra vez y aún no terminó, terminas antes de tiempo
  onEndPress() {
    if (!this.finished) {
      this.finishWalk();
    }
  }

  continue(path: string) {
    this.router.navigateByUrl(path);     // o this.router.navigate([path])
  }
}
