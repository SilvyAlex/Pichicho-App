import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonImg, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline, volumeHighOutline, chevronForwardOutline, constructOutline
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';

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

  petName = '';
  activities: any[] = [];
  trainedToday = false;
  progress = 0;
  profileId = '';
  completedActivityId: string | null = null;

  @ViewChild('scroller') scrollerRef!: ElementRef<HTMLDivElement>;

  constructor(
    private router: Router,
    private firebase: FirebaseService,
    private session: SessionService,
    private toastCtrl: ToastController
  ) {
    addIcons({ chevronBackOutline, volumeHighOutline, chevronForwardOutline, constructOutline });
  }

  async ngOnInit() {
    const profile: Profile | null = this.session.snapshot;
    if (profile) {
      this.petName = profile.nombrePerro;
      this.profileId = profile.id!;
    }

    this.activities = await this.firebase.getEntrenamientos();
    await this.loadDailyTrainingStatus();
  }

  /** 📅 Verificar si ya entrenó hoy */
  async loadDailyTrainingStatus() {
    if (!this.profileId) return;
    const { trainedToday, activityId } = await this.firebase.getDailyTrainingStatus(this.profileId);
    this.trainedToday = trainedToday;
    this.completedActivityId = activityId || null;
    this.progress = trainedToday ? 1 : 0;
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

  async continue(entrenamientoId: string) {
    if (this.trainedToday) {
      await this.showToast('✅ Ya completaste el entrenamiento de hoy');
      return;
    }
    this.router.navigate(['/entrena3', entrenamientoId]);
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
