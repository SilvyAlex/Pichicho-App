import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { RouterModule, Router } from '@angular/router';
import { checkmarkOutline,homeOutline, heartOutline, personOutline } from 'ionicons/icons';

import { SessionService } from '../../services/session';  // 👈
import { Observable } from 'rxjs';
import { Profile } from '../../models/profile.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
  
})
export class HomePage {
  progreso = {
    comida: { done: 2, total: 2 },
    paseos: { done: 1, total: 2 },
    entreno: { done: 1, total: 2 },
    score: 87
  };

  profile$: Observable<Profile | null>;  

  constructor(
    private router: Router,
    private session: SessionService      
  ) {
    addIcons({ checkmarkOutline, homeOutline, heartOutline, personOutline });
    this.profile$ = this.session.profile$;  
  }

  continue(path: string) {
    this.router.navigateByUrl(path);
  }
}
