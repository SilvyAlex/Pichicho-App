import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline,homeOutline, heartOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-puntos',
  templateUrl: './puntos.page.html',
  styleUrls: ['./puntos.page.scss'],
  standalone: true,
  imports: [IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonImg, CommonModule]
})
export class PuntosPage implements OnInit {

  petName = 'Pelusa';

  // Donut config
  target = 78;           // valor final
  shown  = 0;            // valor mostrado (se anima)
  radius = 62;
  stroke = 14;

  // IDs únicos para gradientes/filtros del SVG
  gradStrokeId = 'gStroke' + Math.random().toString(36).slice(2);
  gradTrackId  = 'gTrack'  + Math.random().toString(36).slice(2);
  glowId       = 'fGlow'   + Math.random().toString(36).slice(2);

  get center() { return this.radius + this.stroke; }
  get circumference() { return 2 * Math.PI * this.radius; }
  get dashOffset() { return this.circumference * (1 - this.shown / 100); }

  // Coordenadas del puntito final
  get endAngle() { return (this.shown / 100) * 2 * Math.PI - Math.PI / 2; } // inicia arriba
  get endX() { return this.center + this.radius * Math.cos(this.endAngle); }
  get endY() { return this.center + this.radius * Math.sin(this.endAngle); }

  // Barras (opcional)
  dayValues = [40, 62, 55, 70, 60, 90, 88];
  dayLabels = ['L','M','M','J','V','S','D'];
  dayColors = ['#f97316','#60a5fa','#d946ef','#38bdf8','#94a3b8','#34d399','#34d399'];

  constructor() {
    addIcons({ chevronBackOutline, volumeHighOutline, homeOutline, heartOutline, personOutline });
  }

  ngOnInit() {
    this.animateTo(this.target, 900); // animación suave
  }

  private animateTo(value: number, duration = 800) {
    const start = performance.now();
    const from  = this.shown;
    const delta = value - from;

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      this.shown = +(from + delta * ease(p)).toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  speakCard() {
    const text = `Mira tu progreso. Tienes un ${this.target} por ciento de responsabilidad esta semana. ¡Sigue así!`;
    try {
      const s = (window as any).speechSynthesis;
      if (s) { const u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES'; s.cancel(); s.speak(u); }
    } catch {}
  }
}
