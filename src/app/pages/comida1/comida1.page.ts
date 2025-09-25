import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonImg,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  volumeHighOutline,
  pawOutline
} from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';
import { FeedingService, FeedingResult } from '../../services/feeding.service';
type FeedTime = 'dia' | 'noche';

@Component({
  selector: 'app-comida1',
  templateUrl: './comida1.page.html',
  styleUrls: ['./comida1.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    CommonModule,
    FormsModule,
    IonImg
  ]
})
export class Comida1Page implements OnInit {
  userName = '';
  petName = '';
  feeding: FeedingResult = { grams: 0, scoops: 0, paseo: 0, edadHumana: '-' }

  time: FeedTime = 'noche'; // por defecto Noche

  constructor(
    private router: Router,
    private session: SessionService,
    private feedingSvc: FeedingService
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, pawOutline });
  }

  ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.userName = profile.nombreNino;
      this.petName = profile.nombrePerro;
      this.feeding = this.feedingSvc.calculate(profile);
    }
  }

  handleSegmentChange(ev: CustomEvent) {
    this.time = (ev.detail.value as FeedTime) || 'dia';
  }

  speakCard() {
    const text = `Hola ${this.userName}. Hoy ${this.petName} necesita ${this.feeding.scoops} scoops, es decir ${this.feeding.grams} gramos de croquetas.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        synth.cancel();
        synth.speak(utter);
      }
    } catch {
      console.warn('Speech synthesis no disponible');
    }
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}