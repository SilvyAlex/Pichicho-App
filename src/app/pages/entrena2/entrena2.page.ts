import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

@Component({
  selector: 'app-entrena2',
  templateUrl: './entrena2.page.html',
  styleUrls: ['./entrena2.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    CommonModule,
    RouterModule
  ]
})
export class Entrena2Page implements OnInit {

  petName = 'Pelusa';

  constructor(private router: Router) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  ngOnInit() {}

  speakCard() {
    const text =
      `Dile su nombre con voz alegre. Cuando venga hacia ti, ` +
      `dale una galletita y muchas caricias. Repite esto varias veces hasta que entienda.`;
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        synth.cancel();
        synth.speak(u);
      }
    } catch {}
  }

  finishTraining() {
    console.log('Entrenamiento terminado');
    // Aquí puedes navegar o sumar puntos
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
