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

  // Igual que en intro1
  audioEnabled = false; // el usuario ya tocó el botón al menos una vez
  isSpeaking = false;   // está hablando ahora mismo

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit() {}

  /**
   * Botón de audio:
   * - Primer toque: da permiso y reproduce el slide actual.
   * - Siguientes toques: alterna entre reproducir y detener.
   */
  async onAudioButtonClick() {
    // El niño ya dio permiso para usar audio
    if (!this.audioEnabled) {
      this.audioEnabled = true;
    }

    // Siempre sincronizar el índice activo con el swiper antes de hablar
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (swiperInstance && typeof swiperInstance.activeIndex === 'number') {
      const idx = swiperInstance.activeIndex;
      this.active = Math.max(0, Math.min(idx, this.total - 1));
    }

    // Si está hablando → detener
    if (this.isSpeaking) {
      await this.stopCurrentSpeech();
      return;
    }

    // Si no está hablando → reproducir el slide actual
    await this.stopCurrentSpeech(); // por si quedó algo colgado
    await this.speakCurrentSlide();
  }

  /** Detener cualquier audio actual (web o nativo) */
  async stopCurrentSpeech() {
    this.isSpeaking = false;

    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      if ('speechSynthesis' in window) {
        (window as any).speechSynthesis.cancel();
      }
    } else {
      try {
        await TextToSpeech.stop();
      } catch (err) {
        console.warn('Error al detener TTS nativo:', err);
      }
    }
  }

  /**
   * Se dispara cuando cambias de slide (por swipe, dots o por código).
   * Se enlaza en el HTML con (slidechange)="onSlideChangeEvent($event)".
   */
  onSlideChangeEvent(event?: any) {
    const swiperInstance = this.swiper?.nativeElement?.swiper;

    // Swiper web component puede exponer el índice en el propio swiper o en event.detail[0]
    const idx =
      swiperInstance?.activeIndex ??
      event?.detail?.[0]?.activeIndex ??
      0;

    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));

      // Siempre detenemos audio al cambiar de slide
      this.stopCurrentSpeech();
      // NO autoreproducimos el nuevo slide, el niño decide.
    });
  }

  /** Avanza al siguiente slide o navega */
  continue() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    // Antes de cambiar de slide o salir, detenemos audio
    this.stopCurrentSpeech();

    if (this.active < this.total - 1) {
      swiperInstance.slideNext();

      const idx = swiperInstance.activeIndex ?? this.active + 1;
      this.ngZone.run(() => {
        this.active = Math.max(0, Math.min(idx, this.total - 1));
      });
    } else {
      this.router.navigate(['/home']); // o la ruta que toque
    }
  }

  /** Ir directo a un slide desde los dots */
  goTo(i: number) {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    // Detenemos audio antes de cambiar
    this.stopCurrentSpeech();

    swiperInstance.slideTo(i);
    this.ngZone.run(() => {
      this.active = i;
    });
  }

  /**
   * Reproduce título + descripción + labels de las cards del slide actual
   * Funciona tanto en web como en APK.
   */
  async speakCurrentSlide() {
    if (!this.audioEnabled) return;

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

    // Leer también los labels de las cards (Comida, Entrenamiento, Paseos, etc.)
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
        const synth = (window as any).speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(toSpeak);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;

        this.isSpeaking = true;

        utterance.onend = () => {
          this.isSpeaking = false;
        };
        utterance.onerror = () => {
          this.isSpeaking = false;
        };

        synth.cancel();
        synth.speak(utterance);
      } catch (e) {
        console.warn('No se pudo reproducir la locución:', e);
        this.isSpeaking = false;
      }
    } else {
      // ===== APK (Android / iOS) → Plugin nativo de TTS =====
      try {
        this.isSpeaking = true;

        await TextToSpeech.speak({
          text: toSpeak,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });

        this.isSpeaking = false;
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
        this.isSpeaking = false;
      }
    }
  }

  /** Por si salen de la pantalla mientras suena el audio */
  ionViewWillLeave() {
    this.stopCurrentSpeech();
  }
}
