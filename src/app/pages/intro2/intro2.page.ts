import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { volumeHighOutline, volumeHigh } from 'ionicons/icons';

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

  /** Se dispara cuando cambias de slide */
  onSlideChangeEvent() {
    const idx = this.swiper?.nativeElement?.swiper?.activeIndex ?? 0;
    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));
    });
  }

  /** Avanza al siguiente slide o navega */
  continue() {
    if (this.active < this.total - 1) {
      this.swiper?.nativeElement?.swiper?.slideNext();
      const idx = this.swiper?.nativeElement?.swiper?.activeIndex ?? this.active + 1;
      this.ngZone.run(() => (this.active = Math.max(0, Math.min(idx, this.total - 1))));
    } else {
      this.router.navigate(['/home']); // cambia la ruta final aquí
    }
  }

  goTo(i: number) {
    this.swiper?.nativeElement?.swiper?.slideTo(i);
    this.ngZone.run(() => (this.active = i));
  }

  /** Reproduce el título + descripción del slide actual */
  speakCurrentSlide() {
    try {
      window.speechSynthesis.cancel();

      const slides: NodeListOf<HTMLElement> =
        this.swiper?.nativeElement?.querySelectorAll('swiper-slide') ?? ([] as any);
      const slide = slides[this.active];
      if (!slide) return;

      const titleEl = slide.querySelector('[data-read="title"]') || slide.querySelector('h2');
      const descEl  = slide.querySelector('[data-read="desc"]')  || slide.querySelector('p');

      const title = (titleEl?.textContent || '').trim();
      const desc  = (descEl?.textContent || '').trim();
      const toSpeak = [title, desc].filter(Boolean).join('. ');

      if (!toSpeak) return;
      const utter = new SpeechSynthesisUtterance(toSpeak);
      utter.lang = 'es-ES';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('No se pudo reproducir la locución:', e);
    }
  }
}
