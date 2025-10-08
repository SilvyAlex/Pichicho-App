import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonImg } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  homeOutline,
  heartOutline,
  personOutline
} from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-puntos',
  templateUrl: './puntos.page.html',
  styleUrls: ['./puntos.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonImg, CommonModule]
})
export class PuntosPage implements OnInit {

  petName = '';
  puntosHoy = 0;
  porcentaje = 0;

  // Donut visual
  shown = 0;
  radius = 62;
  stroke = 14;

  gradStrokeId = 'gStroke' + Math.random().toString(36).slice(2);
  gradTrackId  = 'gTrack'  + Math.random().toString(36).slice(2);
  glowId       = 'fGlow'   + Math.random().toString(36).slice(2);

  get center() { return this.radius + this.stroke; }
  get circumference() { return 2 * Math.PI * this.radius; }
  get dashOffset() { return this.circumference * (1 - this.shown / 100); }

  get endAngle() { return (this.shown / 100) * 2 * Math.PI - Math.PI / 2; }
  get endX() { return this.center + this.radius * Math.cos(this.endAngle); }
  get endY() { return this.center + this.radius * Math.sin(this.endAngle); }

  // Barras por día (lunes a domingo)
  dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  dayValues: number[] = [];
  dayColors = ['#f97316','#60a5fa','#d946ef','#38bdf8','#94a3b8','#34d399','#34d399'];

  constructor(
    private firebase: FirebaseService,
    private session: SessionService
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, homeOutline, heartOutline, personOutline });
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (!profile) return;

    this.petName = profile.nombrePerro;
    await this.loadProgress(profile.id);
  }

  /** 📊 Cargar progreso diario */
  async loadProgress(profileId: string) {
    try {
      // 🔹 Obtenemos el perfil actual
      const profile = this.session.snapshot;
      if (!profile) return;

      // 🔹 Puntos totales actuales
      const puntos = profile.puntos || 0;

      // 🔹 Calcular progreso diario (máx 45 puntos)
      this.puntosHoy = Math.min(puntos, 45);
      this.porcentaje = Math.round((this.puntosHoy / 45) * 100);

      // Si no hay puntos, deja todo en 0
      if (!this.puntosHoy) this.porcentaje = 0;

      // 🔹 Anima el donut
      this.animateTo(this.porcentaje, 900);

      // 🔹 Genera barras semanales (vacías si no hay datos)
      this.dayValues = this.generateWeekBars(this.porcentaje);

    } catch (err) {
      console.error('Error al cargar progreso:', err);
    }
  }

  /** 🎨 Animación suave del donut */
  private animateTo(value: number, duration = 800) {
    const start = performance.now();
    const from = this.shown;
    const delta = value - from;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      this.shown = +(from + delta * ease(p)).toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** 📅 Generar valores para las barras semanales */
  private generateWeekBars(todayPercent: number): number[] {
    // Simula una semana: 6 días previos vacíos o 0, último = progreso de hoy
    const days = new Array(6).fill(0); // vacíos
    days.push(todayPercent); // día actual
    return days;
  }

  /** 🗣️ Texto hablado */
  speakCard() {
    const text = this.porcentaje > 0
      ? `Mira tu progreso. Tienes un ${this.porcentaje}% de responsabilidad hoy. ¡Sigue así!`
      : `Aún no has registrado actividades hoy. ¡Recuerda alimentar, pasear y entrenar a ${this.petName}!`;

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
}
