import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonImg,
  IonAlert,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';

interface DayCell {
  date: Date;
  inMonth: boolean;
  dayNum: number | '';
  selected?: boolean;
  est?: boolean; // estimado para próximo baño
}

@Component({
  selector: 'app-limpieza',
  templateUrl: './limpieza.page.html',
  styleUrls: ['./limpieza.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonImg,
    IonAlert,
    CommonModule,
    FormsModule
  ]
})
export class LimpiezaPage implements OnInit {

  petName = 'Pelusa';

  // Mes mostrado (1er día del mes actual)
  monthDate = new Date();

  // Historial de baños (todas las fechas marcadas en amarillo)
  banos: Date[] = [];
  proximoBano: Date | null = null;
  profileId: string | null = null;

  weeks: DayCell[][] = [];
  monthLabel = '';

  // Popup
  isConfirmOpen = false;
  pendingCell: DayCell | null = null;
  confirmMessage = '';
  confirmButtons: Array<any> = [];

  constructor(
    private firebase: FirebaseService,
    private session: SessionService
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline });

    this.confirmButtons = [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Sí', role: 'confirm', handler: () => this.confirmSelect() }
    ];
  }

  async ngOnInit() {
    this.confirmMessage = `¿Has bañado a ${this.petName}?`;
    this.rebuild();

    // ⚡ Recuperar profileId desde la sesión
    const profile = this.session.snapshot;
    if (profile) {
      this.profileId = profile.id;
      const data = await this.firebase.getBathHistory(profile.id);
      this.banos = data.banos;
      this.proximoBano = data.proximoBano || null;
      this.rebuild();
    }
  }

  /** Construye la grilla del mes y aplica selección/estimados */
  private rebuild() {
    this.monthLabel = this.monthDate.toLocaleDateString('es-ES', {
      month: 'long', year: 'numeric'
    });

    const year = this.monthDate.getFullYear();
    const month = this.monthDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay(); // 0=Dom..6=Sáb
    const startDate = new Date(year, month, 1 - startDow);

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const inMonth = d.getMonth() === month;
      cells.push({ date: d, inMonth, dayNum: inMonth ? d.getDate() : '' });
    }

    // Pintar todos los baños en amarillo
    cells.forEach(c => {
      c.selected = this.banos.some(b => this.sameDate(c.date, b));
    });

    // Pintar estimados solo desde el último baño
    if (this.banos.length > 0) {
      const ultimo = this.banos[this.banos.length - 1];
      const estStart = this.addDays(ultimo, 28);
      const estEnd   = this.addDays(ultimo, 30);
      cells.forEach(c => { c.est = c.inMonth && this.inRange(c.date, estStart, estEnd); });
    } else {
      cells.forEach(c => c.est = false);
    }

    // A semanas
    this.weeks = [];
    for (let i = 0; i < 6; i++) this.weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  // Helpers
  private sameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
  }
  private addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
  private inRange(d: Date, a: Date, b: Date) {
    const t  = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const ta = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const tb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return t >= ta && t <= tb && d.getMonth() === this.monthDate.getMonth();
  }

  // UI
  selectDay(cell: DayCell) {
    if (!cell.inMonth || !cell.dayNum) return;
    this.pendingCell = cell;
    this.isConfirmOpen = true; // abrir confirmación
  }

  async confirmSelect() {
    if (!this.pendingCell || !this.profileId) return;

    const nuevaFecha = new Date(this.pendingCell.date);

    // Evitar duplicados (si ya existe en el historial)
    if (!this.banos.some(b => this.sameDate(b, nuevaFecha))) {
      this.banos.push(nuevaFecha);
    }

    // Próximo baño calculado desde la última fecha
    this.proximoBano = this.addDays(nuevaFecha, 30);

    // Guardar en Firebase (acumulando historial)
    await this.firebase.addBathDate(this.profileId, nuevaFecha, this.proximoBano);

    this.pendingCell = null;
    this.isConfirmOpen = false;
    this.rebuild();
  }

  prevMonth() {
    this.monthDate = new Date(this.monthDate.getFullYear(), this.monthDate.getMonth() - 1, 1);
    this.rebuild();
  }

  nextMonth() {
    this.monthDate = new Date(this.monthDate.getFullYear(), this.monthDate.getMonth() + 1, 1);
    this.rebuild();
  }

  speakCard() {
    const text =
      `¡Hora de planear el baño de ${this.petName}! ` +
      `Selecciona el día de su último baño. Se confirmará con un círculo amarillo.`;
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
