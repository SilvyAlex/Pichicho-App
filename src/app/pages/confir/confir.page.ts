import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { volumeHighOutline } from 'ionicons/icons';

addIcons({
  'volume-high-outline': volumeHighOutline,
});

@Component({
  selector: 'app-confir',
  templateUrl: './confir.page.html',
  styleUrls: ['./confir.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule],
})
export class ConfirPage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {}

  /** Navega a la pantalla de instrucciones */
  goToInstructions() {
    this.router.navigate(['/intro-instrucciones']);
  }

  /** Lee en voz alta el título y la descripción de la vista */
  speak() {
    try {
      // Cancela cualquier lectura previa
      window.speechSynthesis.cancel();

      // Toma el título y la descripción marcados con data-read
      const title = (document.querySelector('[data-read="title"]')?.textContent || '').trim();
      const desc  = (document.querySelector('[data-read="desc"]')?.textContent || '').trim();
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
