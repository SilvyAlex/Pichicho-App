import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { CommonModule } from '@angular/common';
import { IonContent, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
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
  profileId = localStorage.getItem('profileId') || '';

  constructor(
    private route: ActivatedRoute,
    private firebase: FirebaseService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline });
  }

  async ngOnInit() {
    const entrenamientoId = this.route.snapshot.paramMap.get('id');
    if (entrenamientoId) {
      this.data = await this.firebase.getEntrenamientoById(entrenamientoId);
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

  async finishTraining() {
    if (!this.profileId || !this.data) return;

    await this.firebase.addTrainingEvidence(this.profileId, this.data.id || 'sin_id');

    const alert = await this.alertCtrl.create({
      header: '¡Buen trabajo!',
      message: 'Has completado el entrenamiento de hoy y ganaste 15 puntos 🦴',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.router.navigate(['/entrena1']);
          }
        }
      ]
    });

    await alert.present();
  }
}
