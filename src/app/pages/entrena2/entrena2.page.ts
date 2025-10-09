import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { CommonModule } from '@angular/common';
import { IonContent, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline } from 'ionicons/icons';

@Component({
  selector: 'app-entrena2',
  templateUrl: './entrena2.page.html',
  styleUrls: ['./entrena2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon
  ]
})
export class Entrena2Page implements OnInit {

  data: any = null;

  constructor(
    private route: ActivatedRoute,
    private firebase: FirebaseService,
    private router: Router
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  async ngOnInit() {
    const entrenamientoId = this.route.snapshot.paramMap.get('id');
    console.log('Entrenamiento cargado:', entrenamientoId);

    if (entrenamientoId) {
      this.data = await this.firebase.getEntrenamientoById(entrenamientoId);
      console.log('Datos del entrenamiento:', this.data);
    }
  }

  speakCard() {
    if (!this.data) return;
    const text = `${this.data.descripcion}. ${this.data.pasos?.join('. ') || ''}`;
    const synth = (window as any).speechSynthesis;
    if (synth) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      synth.cancel();
      synth.speak(u);
    }
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
