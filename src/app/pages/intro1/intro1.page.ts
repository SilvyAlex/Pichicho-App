import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
  OnDestroy,
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
export class Intro1Page implements OnInit, OnDestroy {
  @ViewChild('swiper', { read: ElementRef, static: true })
  swiper?: ElementRef<any>;

  total = 3;
  active = 0;
  dots = [0, 1, 2];

  // audioEnabled: el niño ya tocó el botón y dio permiso
  audioEnabled = false;
  // isSpeaking: indica si el TTS está sonando
  isSpeaking = false;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit() {}

  ngOnDestroy() {
    // Seguridad extra: por si esta vista se destruye sin ionViewWillLeave
    this.stopCurrentSpeech();
  }

  /**
   * Botón de audio:
   * - Primer toque: da permiso y lee el slide actual.
   * - Siguientes toques: toggle play / stop del slide actual.
   */
  async onAudioButtonClick() {
    if (!this.audioEnabled) {
      this.audioEnabled = true;
    }

    // Sincronizar índice activo con el swiper antes de hablar
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (swiperInstance) {
      const idx = swiperInstance.activeIndex ?? this.active;
      this.active = Math.max(0, Math.min(idx, this.total - 1));
    }

    // Si está hablando → detener
    if (this.isSpeaking) {
      await this.stopCurrentSpeech();
      return;
    }

    // Si NO está hablando → reproducir el slide actual
    await this.stopCurrentSpeech();
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
   * Evento al cambiar de slide (por swipe, dots, o slideNext/slideTo).
   * Importante: en el HTML es (slidechange)="onSlideChangeEvent($event)".
   */
  onSlideChangeEvent(event?: any) {
    const swiperInstance = this.swiper?.nativeElement?.swiper;

    const idx =
      swiperInstance?.activeIndex ??
      event?.detail?.[0]?.activeIndex ??
      0;

    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));

      // Siempre que cambie de slide, apagamos el audio anterior
      this.stopCurrentSpeech();
      // NO autoreproducimos el nuevo slide: el niño debe volver a tocar el botón.
    });
  }

  /** Botón Continuar / Empezar */
  continue() {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    this.stopCurrentSpeech();

    if (this.active < this.total - 1) {
      swiperInstance.slideNext();

      const idx = swiperInstance.activeIndex ?? this.active + 1;

      this.ngZone.run(() => {
        this.active = Math.max(0, Math.min(idx, this.total - 1));
      });
    } else {
      // Último slide → ir al registro
      this.router.navigate(['/registro']);
    }
  }

  /** Ir directo a un slide (dots) */
  goTo(i: number) {
    const swiperInstance = this.swiper?.nativeElement?.swiper;
    if (!swiperInstance) return;

    this.stopCurrentSpeech();

    swiperInstance.slideTo(i);

    this.ngZone.run(() => {
      this.active = i;
    });
  }

  /** Leer el slide actual (solo cuando el usuario lo pide) */
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
      // Web → Web Speech API
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

      this.isSpeaking = true;

      utterance.onend = () => {
        this.isSpeaking = false;
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      synth.speak(utterance);
    } else {
      // Nativo (APK) → plugin de TTS
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

  /** Por si salen de la pantalla mientras suena el audio (Ionic lifecycle) */
  ionViewWillLeave() {
    this.stopCurrentSpeech();
  }
}
