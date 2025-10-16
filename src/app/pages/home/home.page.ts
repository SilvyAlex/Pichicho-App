import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { checkmarkOutline, homeOutline, heartOutline, personOutline } from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { FirebaseService } from '../../services/firebase';
import { Observable } from 'rxjs';
import { Profile } from '../../models/profile.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  profile$: Observable<Profile | null>;
  profileId: string | null = null;

  progreso = {
    comida: { done: 0, total: 2 },
    paseos: { done: 0, total: 2 },
    entreno: { done: 0, total: 1 },
    limpieza: { done: 0 },
    score: 0
  };

  constructor(
    private router: Router,
    private session: SessionService,
    private firebase: FirebaseService
  ) {
    addIcons({ checkmarkOutline, homeOutline, heartOutline, personOutline });
    this.profile$ = this.session.profile$;
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (profile?.id) {
      this.profileId = profile.id;
      await this.loadProgress();
    }
  }

  ionViewWillEnter() {
  if (this.profileId) {
    this.loadProgress();
  }
}


  /** 🔁 Cargar progreso desde Firebase */
  async loadProgress() {
    if (!this.profileId) return;

    // 🦴 Comida
    const { morningFed, eveningFed } = await this.firebase.getDailyFeedStatus(this.profileId);
    this.progreso.comida.done = [morningFed, eveningFed].filter(Boolean).length;

    // 🐾 Paseos
    const { morningWalked, eveningWalked } = await this.firebase.getDailyWalkStatus(this.profileId);
    this.progreso.paseos.done = [morningWalked, eveningWalked].filter(Boolean).length;

    // 🎮 Entrenamiento
    const { trainedToday } = await this.firebase.getDailyTrainingStatus(this.profileId);
    this.progreso.entreno.done = trainedToday ? 1 : 0;

    // 🛁 Limpieza (nuevo)
    const { bathedToday } = await this.firebase.getDailyBathStatus(this.profileId);
    this.progreso.limpieza = { done: bathedToday ? 1 : 0 };

    // 📊 Puntaje total (solo de las 3 principales)
    const totalActividades = 3;
    const promedio =
      (this.progreso.comida.done / this.progreso.comida.total +
        this.progreso.paseos.done / this.progreso.paseos.total +
        this.progreso.entreno.done / this.progreso.entreno.total) / totalActividades;

    this.progreso.score = Math.round(promedio * 100);
  }

  /** Navegar entre pantallas */
  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
