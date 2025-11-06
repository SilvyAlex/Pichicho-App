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
  async ngOnInit() {
    try {
      await this.session.load(); // lo haces async para esperar sin bloquear
      console.log('Sesión cargada correctamente');
    } catch (err) {
      console.warn('Error al cargar sesión:', err);
    }
  }
}
