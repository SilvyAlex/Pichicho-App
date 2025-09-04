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

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit() {}

  /** Llamado por el evento (slidechange) del <swiper-container> */
  onSlideChangeEvent() {
    const idx = this.swiper?.nativeElement?.swiper?.activeIndex ?? 0;
    // Asegura que Angular detecte el cambio (custom event de Web Component)
    this.ngZone.run(() => {
      this.active = Math.max(0, Math.min(idx, this.total - 1));
    });
  }

  continue() {
    if (this.active < this.total - 1) {
      this.swiper?.nativeElement?.swiper?.slideNext();
      // Opcional: sincroniza inmediatamente el estado sin esperar al evento
      const idx = this.swiper?.nativeElement?.swiper?.activeIndex ?? this.active + 1;
      this.ngZone.run(() => (this.active = Math.max(0, Math.min(idx, this.total - 1))));
    } else {
      this.router.navigate(['/registro']);
    }
  }

  goTo(i: number) {
    this.swiper?.nativeElement?.swiper?.slideTo(i);
    this.ngZone.run(() => (this.active = i));
  }

  speakCurrentSlide() {
  // 1. Cancela cualquier lectura en curso
  window.speechSynthesis.cancel();

  // 2. Slide actual
  const slides = this.swiper?.nativeElement?.querySelectorAll('swiper-slide');
  if (!slides || !slides[this.active]) return;

  const slide = slides[this.active] as HTMLElement;

  // 3. Busca por roles; si no existen, cae a h2 y p
  const titleEl =
    slide.querySelector('[data-read="title"]') ||
    slide.querySelector('h2');

  const descEl =
    slide.querySelector('[data-read="desc"]') ||
    slide.querySelector('p');

  const title = (titleEl?.textContent || '').trim();
  const desc  = (descEl?.textContent || '').trim();

  const toSpeak = [title, desc].filter(Boolean).join('. ');

  if (!toSpeak) return;

  const utterance = new SpeechSynthesisUtterance(toSpeak);
  utterance.lang = 'es-ES';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

}
