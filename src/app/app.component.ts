import { Component, OnInit } from '@angular/core';
import { SessionService } from './services/session';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private session: SessionService,
    private router: Router
  ) {}
  async ngOnInit() {
    try {
      // 1️⃣ Cargar el perfil guardado en el teléfono
      await this.session.load();
      console.log('Sesión cargada correctamente');

      // 2️⃣ Revisar si hay perfil
      const profile = this.session.snapshot;

      if (profile) {
        // ✅ Ya se registró antes → ir directo al HOME
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        // ⬅️ No hay perfil → flujo normal: intro1 → registro → intro2 → ...
        this.router.navigateByUrl('/intro1', { replaceUrl: true });
      }
    } catch (err) {
      console.warn('Error al cargar sesión:', err);
      // En caso de error, lo mando a intro1 igual
      this.router.navigateByUrl('/intro1', { replaceUrl: true });
    }
  }
}
