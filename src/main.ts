import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { register } from 'swiper/element/bundle';

//IMPORTS Firebase + environment
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideHttpClient } from '@angular/common/http';

register();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // 🔥 Firebase providers
    provideFirebaseApp(() => initializeApp({
      apiKey: "AIzaSyCI9o29oFCD8hI1a2PLmDoL65SRMYvyxkc",
      authDomain: "pichicho-7fd34.firebaseapp.com",
      projectId: "pichicho-7fd34",
      storageBucket: "pichicho-7fd34.firebasestorage.app",
      messagingSenderId: "59092679526",
      appId: "1:59092679526:web:2d3f181d09b074a7e4a6a7",
      measurementId: "G-GZ8Y02QLK6"
    })),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
}).catch(err => console.error('Error al iniciar app:',err));
