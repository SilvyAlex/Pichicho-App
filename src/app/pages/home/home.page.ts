import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { RouterModule, Router } from '@angular/router';
import { checkmarkOutline,homeOutline, heartOutline, personOutline } from 'ionicons/icons';

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

  constructor(private router: Router) {
  addIcons({ checkmarkOutline, homeOutline, heartOutline, personOutline });
}
   go(url: string) {
    this.router.navigateByUrl(url);
  }
}
