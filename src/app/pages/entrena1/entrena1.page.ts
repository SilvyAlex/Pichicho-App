import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonImg
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  chevronForwardOutline,
  constructOutline
} from 'ionicons/icons';

type Activity = {
  title: string;
  subtitle: string;
  img: string;
};

@Component({
  selector: 'app-entrena1',
  templateUrl: './entrena1.page.html',
  styleUrls: ['./entrena1.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonImg,
    CommonModule,
    FormsModule
  ]
})
export class Entrena1Page implements OnInit {

  petName = 'Pelusa';

  activities: Activity[] = [
    {
      title: 'Nombre',
      subtitle: 'Ayúdalo a reconocer su nombre',
      img: 'assets/images/act-nombre.png'
    },
    {
      title: 'Sentarse',
      subtitle: 'Enséñale a sentarse',
      img: 'assets/images/act-sentarse.png'
    }
  ];

  selected = 0;

  @ViewChild('scroller') scrollerRef!: ElementRef<HTMLDivElement>;

  constructor(private router: Router) {
    addIcons({
      chevronBackOutline,
      volumeHighOutline,
      chevronForwardOutline,
      constructOutline
    });
  }

  ngOnInit() {}

  speakCard() {
    const text = `¡Hora de enseñarle trucos a ${this.petName}! Escoge qué quieres practicar hoy.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        synth.cancel();
        synth.speak(u);
      }
    } catch { /* no-op */ }
  }

  selectActivity(i: number) {
    this.selected = i;
  }

  scrollNext() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: 220, behavior: 'smooth' });
  }
  continue(path: string) {
    this.router.navigateByUrl(path);     // o this.router.navigate([path])
  }
}
