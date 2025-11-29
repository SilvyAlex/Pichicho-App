import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { volumeHighOutline, volumeHigh } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

addIcons({
  'volume-high-outline': volumeHighOutline,
  'volume-high': volumeHigh,
});

@Component({
  selector: 'app-intro2',
  templateUrl: './intro2.page.html',
  styleUrls: ['./intro2.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Intro2Page implements OnInit {
  @ViewChild('swiper', { read: ElementRef, static: true })
  swiper?: ElementRef<any>;

  total = 3;
  active = 0; // arranca en el primer slide
  dots = [0, 1, 2];

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit() {}

  /** Se dispara cuando cambias de slide (por swipe o por código) */
  onSlideChangeEvent() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    const idx = swiperInstance?.activeIndex ?? 0;

    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));
    });
  }

  /** Avanza al siguiente slide o navega */
  continue() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    if (this.active < this.total - 1) {
      swiperInstance.slideNext();

      const idx = swiperInstance.activeIndex ?? this.active + 1;
      this.ngZone.run(() => {
        this.active = Math.max(0, Math.min(idx, this.total - 1));
      });
    } else {
      this.router.navigate(['/home']); // cambia la ruta final aquí si quieres
    }
  }

  /** Ir directo a un slide desde los dots */
  goTo(i: number) {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    swiperInstance.slideTo(i);
    this.ngZone.run(() => {
      this.active = i;
    });
  }

  /** Reproduce título + descripción + labels de las cards del slide actual (web + APK) */
  async speakCurrentSlide() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;

    // Tomar el índice REAL del swiper para evitar desfaces al hacer swipe
    let idx = this.active;
    if (swiperInstance && typeof swiperInstance.activeIndex === 'number') {
      idx = swiperInstance.activeIndex;
      this.active = Math.max(0, Math.min(idx, this.total - 1));
    }

    const slides: NodeListOf<HTMLElement> =
      this.swiper?.nativeElement?.querySelectorAll('swiper-slide') ?? ([] as any);

    const slide = slides[idx];
    if (!slide) return;

    const titleEl =
      slide.querySelector('[data-read="title"]') || slide.querySelector('h2');
    const descEl =
      slide.querySelector('[data-read="desc"]') || slide.querySelector('p');

    const title = (titleEl?.textContent || '').trim();
    const desc = (descEl?.textContent || '').trim();

    // NUEVO: leer también los labels de las cards (Comida, Entrenamiento, Paseos, etc.)
    const labelEls = slide.querySelectorAll('.label');
    const labels: string[] = [];
    labelEls.forEach((el) => {
      const txt = (el.textContent || '').trim();
      if (txt) labels.push(txt);
    });

    const extraLabels = labels.join(', '); // "Comida, Entrenamiento, Paseos..."

    const parts = [title, desc, extraLabels].filter(Boolean);
    const toSpeak = parts.join('. ');

    if (!toSpeak) return;

    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      // ===== Entorno web (localhost / navegador) → Web Speech API =====
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      try {
        (window as any).speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(toSpeak);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;

        (window as any).speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('No se pudo reproducir la locución:', e);
      }
    } else {
      // ===== APK (Android / iOS) → Plugin nativo de TTS =====
      try {
        await TextToSpeech.stop(); // detener cualquier lectura anterior

        await TextToSpeech.speak({
          text: toSpeak,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
      }
    }
  }
}
