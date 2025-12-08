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
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

addIcons({
  'volume-high-outline': volumeHighOutline,
  'volume-high': volumeHigh,
});

@Component({
  selector: 'app-intro1',
  standalone: true,
  templateUrl: './intro1.page.html',
  styleUrls: ['./intro1.page.scss'],
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Intro1Page implements OnInit {
  @ViewChild('swiper', { read: ElementRef, static: true })
  swiper?: ElementRef<any>;

  total = 3;
  active = 0;
  dots = [0, 1, 2];

  /**
   * audioEnabled: indica si el usuario ya dio "permiso" tocando el botón al menos una vez.
   * isSpeaking: indica si actualmente se está reproduciendo audio.
   */
  audioEnabled = false;
  isSpeaking = false;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit() {}

  /**
   * Botón de audio:
   * - Primer toque: da permiso y reproduce el slide actual.
   * - Siguiente toque: detiene el audio.
   */
  async onAudioButtonClick() {
    // El niño ya dio permiso para usar audio
    if (!this.audioEnabled) {
      this.audioEnabled = true;

      // Aseguramos que el índice active coincide con el slide real
      const swiperInstance = this.swiper?.nativeElement?.swiper;
      if (swiperInstance) {
        const idx = swiperInstance.activeIndex ?? this.active;
        this.active = Math.max(0, Math.min(idx, this.total - 1));
      }
    }

    // Si está hablando → detener (pausa/stop)
    if (this.isSpeaking) {
      await this.stopCurrentSpeech();
      return;
    }

    // Si NO está hablando → reproducir el slide actual
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

  /** Evento al cambiar de slide (por swipe o por código) */
  onSlideChangeEvent() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    const idx = swiperInstance?.activeIndex ?? 0;

    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));

      // Al cambiar de slide SIEMPRE se detiene el audio anterior
      this.stopCurrentSpeech();
      // Ojo: ya NO autoreproducimos el siguiente slide.
      // Los niños deciden cuándo escuchar tocando el botón.
    });
  }

  /** Botón Continuar */
  continue() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    // Siempre paramos audio al cambiar de slide o salir
    this.stopCurrentSpeech();

    if (this.active < this.total - 1) {
      swiperInstance.slideNext();

      const idx = swiperInstance.activeIndex ?? this.active + 1;

      this.ngZone.run(() => {
        this.active = Math.max(0, Math.min(idx, this.total - 1));
        // Ya no llamamos speakCurrentSlide aquí.
      });
    } else {
      // Navegamos a registro y nos aseguramos de que no quede audio
      this.router.navigate(['/registro']);
    }
  }

  /** Ir directo a un slide (dots) */
  goTo(i: number) {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    // Detenemos el audio antes de cambiar
    this.stopCurrentSpeech();

    swiperInstance.slideTo(i);

    this.ngZone.run(() => {
      this.active = i;
      // No autoreproducimos audio
    });
  }

  /** Leer el slide actual (solo se llama cuando el usuario quiere escuchar) */
  async speakCurrentSlide() {
    if (!this.audioEnabled) return;

    const slides =
      this.swiper?.nativeElement?.querySelectorAll('swiper-slide');
    if (!slides || !slides[this.active]) return;

    const slide = slides[this.active] as HTMLElement;

    const titleEl =
      slide.querySelector('[data-read="title"]') || slide.querySelector('h2');

    const descEl =
      slide.querySelector('[data-read="desc"]') || slide.querySelector('p');

    const title = (titleEl?.textContent || '').trim();
    const desc = (descEl?.textContent || '').trim();

    const toSpeak = [title, desc].filter(Boolean).join('. ');
    if (!toSpeak) return;

    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      // Entorno web → Web Speech API
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      const synth = (window as any).speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(toSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;

      // Marcamos que está hablando
      this.isSpeaking = true;

      utterance.onend = () => {
        this.isSpeaking = false;
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      synth.speak(utterance);
    } else {
      // APK (Android / iOS) → plugin nativo de TTS
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

        // Cuando termina de hablar
        this.isSpeaking = false;
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
        this.isSpeaking = false;
      }
    }
  }
}
