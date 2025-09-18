import { Component, OnInit } from '@angular/core';
import { SessionService } from './services/session';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private session: SessionService) {}
  ngOnInit() {
    this.session.load();    // ← carga perfil guardado (si existe)
  }
}
