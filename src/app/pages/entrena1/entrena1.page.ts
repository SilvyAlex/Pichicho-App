import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline, volumeHighOutline, chevronForwardOutline, constructOutline
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase';

@Component({
  selector: 'app-entrena1',
  templateUrl: './entrena1.page.html',
  styleUrls: ['./entrena1.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonImg,
    CommonModule, FormsModule, RouterModule
  ]
})
export class Entrena1Page implements OnInit {

  petName = 'Pelusa';
  activities: any[] = [];
  selected = 0;
  @ViewChild('scroller') scrollerRef!: ElementRef<HTMLDivElement>;

  constructor(private router: Router, private firebase: FirebaseService) {
    addIcons({ chevronBackOutline, volumeHighOutline, chevronForwardOutline, constructOutline });
  }

  async ngOnInit() {
    // 🚀 Cargar entrenamientos desde Firebase
    this.activities = await this.firebase.getEntrenamientos();
  }

  speakCard() {
    const text = `¡Hora de enseñarle trucos a ${this.petName}! Escoge qué quieres practicar hoy.`;
    const synth = (window as any).speechSynthesis;
    if (synth) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      synth.cancel();
      synth.speak(u);
    }
  }

  scrollNext() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: 220, behavior: 'smooth' });
  }

  continue(entrenamientoId: string) {
    this.router.navigate(['/entrena2', entrenamientoId]);
  }
}
