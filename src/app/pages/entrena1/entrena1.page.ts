import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonImg } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { addIcons } from 'ionicons';
import { chevronBackOutline, volumeHighOutline, chevronForwardOutline, constructOutline } from 'ionicons/icons';

@Component({
  selector: 'app-entrena1',
  templateUrl: './entrena1.page.html',
  styleUrls: ['./entrena1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonImg
  ]
})
export class Entrena1Page implements OnInit {
  @ViewChild('scroller') scroller!: ElementRef;
  petName = 'Pichicho';
  activities: any[] = [];
  progress = 0;
  trainedToday = false;
  completedActivityId: string | null = null;

  profileId = localStorage.getItem('profileId') || ''; // ID del registro del niño

  constructor(
    private firebase: FirebaseService,
    private router: Router
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, chevronForwardOutline, constructOutline });
  }

  async ngOnInit() {
    // 1️⃣ Cargar todos los entrenamientos desde Firebase
    this.activities = await this.firebase.getEntrenamientos();
    console.log('Entrenamientos cargados:', this.activities);

    // 2️⃣ Revisar si el niño ya completó un entrenamiento hoy
    await this.checkTrainingStatus();
  }

  async ionViewWillEnter() {
    // Se actualiza cuando vuelve desde entrena2
    await this.checkTrainingStatus();
  }

  async checkTrainingStatus() {
    if (!this.profileId) return;
    const status = await this.firebase.getDailyTrainingStatus(this.profileId);
    this.trainedToday = status.trainedToday;
    this.completedActivityId = status.activityId || null;
    this.progress = status.trainedToday ? 1 : 0;
    console.log('Estado entrenamiento diario:', status);
  }

  speakCard() {
    const synth = (window as any).speechSynthesis;
    if (synth) {
      const u = new SpeechSynthesisUtterance('Escoge un entrenamiento para tu mascota.');
      u.lang = 'es-ES';
      synth.cancel();
      synth.speak(u);
    }
  }

  scrollNext() {
    if (this.scroller?.nativeElement) {
      this.scroller.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }

  continue(id: string) {
    if (!this.trainedToday) {
      console.log('Navegando a entrenamiento con ID:', id);
      this.router.navigate(['/entrena2', id]);
    }
  }
}
