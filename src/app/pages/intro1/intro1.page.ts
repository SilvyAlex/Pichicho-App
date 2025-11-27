import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
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

  // Permiso de audio otorgado solo cuando el usuario toca el botón
  audioEnabled = false;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit() {}

  /** Activar narración */
  enableAudio() {
    this.audioEnabled = true;
    this.speakCurrentSlide();
  }

  /** Evento al cambiar de slide */
  onSlideChangeEvent() {
    const idx = this.swiper?.nativeElement?.swiper?.activeIndex ?? 0;

    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));

      // Si ya se dio permiso → narrar automáticamente
      if (this.audioEnabled) {
        this.speakCurrentSlide();
      }
    });
  }

  continue() {
    if (this.active < this.total - 1) {
      this.swiper?.nativeElement?.swiper?.slideNext();
      const idx = this.swiper?.nativeElement?.swiper?.activeIndex ?? this.active + 1;
      this.ngZone.run(() => (this.active = idx));
    } else {
      this.router.navigate(['/registro']);
    }
  }

  goTo(i: number) {
    this.swiper?.nativeElement?.swiper?.slideTo(i);
    this.ngZone.run(() => (this.active = i));

    if (this.audioEnabled) {
      this.speakCurrentSlide();
    }
  }

  /** Leer el slide actual */
  async speakCurrentSlide() {
    if (!this.audioEnabled) return;

    const slides = this.swiper?.nativeElement?.querySelectorAll('swiper-slide');
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
      // ===== Entorno web (localhost / navegador) → Web Speech API =====
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      // Cancelar cualquier lectura previa
      (window as any).speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(toSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;

      (window as any).speechSynthesis.speak(utterance);
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
