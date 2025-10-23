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
  porcentajeSemanal = 0;        // 🔸 porcentaje del donut (toda la semana)
  colorActual = '#22c55e';
  shown = 0;                    // animación del donut
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

  // 📊 barras semanales
  dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  dayValues: number[] = new Array(7).fill(0);
  dayColors: string[] = new Array(7).fill('#e5e7eb');

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
    await this.loadWeeklyProgress(profile.id);
  }

  /** 📅 Calcula el progreso total de la semana */
  async loadWeeklyProgress(profileId: string) {
    const today = new Date();
    const startOfWeek = this.getMonday(today);
    const dailyPercents: number[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const percent = await this.getDayPerformance(profileId, date);
      dailyPercents.push(percent);
    }

    // 🔸 Total semanal (suma de los 7 días / 7)
    const totalSemanal = dailyPercents.reduce((a, b) => a + b, 0) / 7;
    this.porcentajeSemanal = Math.round(totalSemanal);

    // 🔸 color según rango del total semanal
    if (this.porcentajeSemanal <= 45) this.colorActual = '#ef4444';
    else if (this.porcentajeSemanal <= 79) this.colorActual = '#facc15';
    else this.colorActual = '#22c55e';

    // 🔸 animar donut
    this.animateTo(this.porcentajeSemanal, 900);

    // 🔸 actualizar barras (día actual en color, resto neutro si no hay datos)
    this.dayValues = dailyPercents;
    this.dayColors = dailyPercents.map(v =>
      v <= 45 ? '#ef4444' : v <= 79 ? '#facc15' : '#22c55e'
    );
  }

  /** 📈 Porcentaje de un día individual */
  private async getDayPerformance(profileId: string, date: Date): Promise<number> {
    try {
      const feed = await this.firebase.getDailyFeedStatus(profileId, date);
      const walk = await this.firebase.getDailyWalkStatus(profileId, date);
      const train = await this.firebase.getDailyTrainingStatus(profileId, date);

      const comidaDone = [feed.morningFed, feed.eveningFed].filter(Boolean).length;
      const paseosDone = [walk.morningWalked, walk.eveningWalked].filter(Boolean).length;
      const entrenoDone = train.trainedToday ? 1 : 0;

      let base = ((comidaDone / 2) + (paseosDone / 2) + (entrenoDone / 1)) / 3 * 100;

      // 🔸 bonus solo si es hoy
      const today = new Date();
      if (this.sameDate(today, date)) {
        const { hasBath } = await this.firebase.getBathStatus(profileId);
        const { hasVaccine } = await this.firebase.getVaccineStatus(profileId);
        const bonus = (hasBath ? 5 : 0) + (hasVaccine ? 5 : 0);
        base = Math.min(base + bonus, 100);
      }

      return base;
    } catch {
      return 0;
    }
  }

  /** 📅 lunes de la semana actual */
  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private sameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  /** 🎨 animación del donut */
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
}
