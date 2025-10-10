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
    entreno: { done: 0, total: 2 },
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

  /** 🔁 Cargar progreso real desde Firebase */
  async loadProgress() {
    if (!this.profileId) return;

    // 1️⃣ Obtener progreso de comida desde Firebase
    const { morningFed, eveningFed } = await this.firebase.getDailyFeedStatus(this.profileId);
    const doneComida = [morningFed, eveningFed].filter(Boolean).length;

    this.progreso.comida.done = doneComida;
    this.progreso.comida.total = 2;

    // 2️⃣ (Temporal) otros valores de ejemplo
    this.progreso.paseos.done = 1;
    this.progreso.paseos.total = 2;
    this.progreso.entreno.done = 1;
    this.progreso.entreno.total = 2;

    // 3️⃣ Calcular score promedio (más adelante se conecta todo)
    const totalActividades = 3;
    const promedio =
      (this.progreso.comida.done / this.progreso.comida.total +
        this.progreso.paseos.done / this.progreso.paseos.total +
        this.progreso.entreno.done / this.progreso.entreno.total) /
      totalActividades;

    this.progreso.score = Math.round(promedio * 100);
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
