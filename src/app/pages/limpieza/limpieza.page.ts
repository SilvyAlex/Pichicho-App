import { Component, OnInit, OnDestroy } from '@angular/core';
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

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

interface DayCell {
  date: Date;
  inMonth: boolean;
  dayNum: number | '';
  selected?: boolean;
  est?: boolean;
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
export class LimpiezaPage implements OnInit, OnDestroy {

  petName = '';
  profileId: string | null = null;

  monthDate = new Date();
  banos: Date[] = [];
  proximoBano: Date | null = null;

  weeks: DayCell[][] = [];
  monthLabel = '';

  isConfirmOpen = false;
  pendingCell: DayCell | null = null;
  confirmMessage = '';
  confirmButtons: Array<any> = [];

  /** 🔊 Estado de audio */
  isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

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
    const profile = this.session.snapshot;
    if (profile) {
      this.profileId = profile.id;
      this.petName = profile.nombrePerro || 'tu perrito';

      this.confirmMessage = `¿Has bañado a ${this.petName}?`;

      const data = await this.firebase.getBathHistory(profile.id);
      this.banos = data.banos;
      this.proximoBano = data.proximoBano || null;
    } else {
      this.petName = 'tu perrito';
      this.confirmMessage = `¿Has bañado a tu perrito?`;
    }

    this.rebuild();
  }

  /** 🚪 Cortar audio al salir de la vista */
  ionViewWillLeave() {
    this.stopSpeech();
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  /** Construye el calendario con baños y estimaciones */
  private rebuild() {
    this.monthLabel = this.monthDate.toLocaleDateString('es-ES', {
      month: 'long', year: 'numeric'
    });

    const year = this.monthDate.getFullYear();
    const month = this.monthDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay();
    const startDate = new Date(year, month, 1 - startDow);

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const inMonth = d.getMonth() === month;
      cells.push({ date: d, inMonth, dayNum: inMonth ? d.getDate() : '' });
    }

    // Pintar baños anteriores
    cells.forEach(c => {
      c.selected = this.banos.some(b => this.sameDate(c.date, b));
    });

    // Pintar estimados
    if (this.banos.length > 0) {
      const ultimo = this.banos[this.banos.length - 1];
      const estStart = this.addDays(ultimo, 28);
      const estEnd = this.addDays(ultimo, 30);
      cells.forEach(c => {
        c.est = c.inMonth && this.inRange(c.date, estStart, estEnd);
      });
    } else {
      cells.forEach(c => c.est = false);
    }

    // Dividir en semanas
    this.weeks = [];
    for (let i = 0; i < 6; i++) this.weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  private sameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  private inRange(d: Date, a: Date, b: Date) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const ta = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const tb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return t >= ta && t <= tb && d.getMonth() === this.monthDate.getMonth();
  }

  selectDay(cell: DayCell) {
    if (!cell.inMonth || !cell.dayNum) return;
    this.pendingCell = cell;
    this.isConfirmOpen = true;
  }

  async confirmSelect() {
    if (!this.pendingCell || !this.profileId) return;

    const nuevaFecha = new Date(this.pendingCell.date);

    if (!this.banos.some(b => this.sameDate(b, nuevaFecha))) {
      this.banos.push(nuevaFecha);
    }

    this.proximoBano = this.addDays(nuevaFecha, 30);

    await this.firebase.addBathDate(this.profileId, nuevaFecha, this.proximoBano);

    this.pendingCell = null;
    this.isConfirmOpen = false;
    this.rebuild();
  }

  prevMonth() {
    this.monthDate = new Date(
      this.monthDate.getFullYear(),
      this.monthDate.getMonth() - 1,
      1
    );
    this.rebuild();
  }

  nextMonth() {
    this.monthDate = new Date(
      this.monthDate.getFullYear(),
      this.monthDate.getMonth() + 1,
      1
    );
    this.rebuild();
  }

  /** 🔊 Texto + toggle del botón de audio */
  async speakCard() {
    const text =
      `¡Hora de planear el baño de ${this.petName || 'tu perrito'}! ` +
      `Los perritos necesitan un baño al menos una vez al mes para estar limpios y sanos. ` +
      `Marca en el calendario el día de su último baño. ` +
      `Ese día se verá en amarillo, y los días en celeste serán los estimados para su próximo baño.`;

    await this.toggleSpeech(text);
  }

  /** 👉 Lógica toggle (play / stop) */
  private async toggleSpeech(text: string) {
    if (!text.trim()) return;

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    await this.speak(text);
  }

  /** 🔊 Hablar (web + nativo) */
  private async speak(text: string) {
    if (!text.trim()) return;

    const isNative = Capacitor.isNativePlatform();
    this.isSpeaking = true;

    if (!isNative) {
      // Web → Web Speech API
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        this.isSpeaking = false;
        return;
      }

      try {
        const synth = (window as any).speechSynthesis;
        synth.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utter;
        utter.lang = 'es-ES';
        utter.rate = 0.95;

        utter.onend = () => {
          if (this.currentUtterance === utter) {
            this.isSpeaking = false;
            this.currentUtterance = null;
          }
        };

        utter.onerror = () => {
          if (this.currentUtterance === utter) {
            this.isSpeaking = false;
            this.currentUtterance = null;
          }
        };

        synth.speak(utter);
      } catch (e) {
        console.warn('No se pudo reproducir la locución:', e);
        this.isSpeaking = false;
      }
    } else {
      // APK (Android / iOS) → TextToSpeech
      try {
        await TextToSpeech.stop();

        await TextToSpeech.speak({
          text,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient'
        });
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
      } finally {
        this.isSpeaking = false;
      }
    }
  }

  /** 🧹 Detener cualquier audio activo */
  private stopSpeech() {
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      if ('speechSynthesis' in window) {
        (window as any).speechSynthesis.cancel();
      }
    } else {
      TextToSpeech.stop().catch(() => {});
    }

    this.isSpeaking = false;
    this.currentUtterance = null;
  }
}
