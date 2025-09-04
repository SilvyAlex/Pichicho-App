import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'intro1',
    pathMatch: 'full',
  },
  {
    path: 'intro1',
    loadComponent: () => import('./pages/intro1/intro1.page').then( m => m.Intro1Page)
  },
  
  {
    path: 'intro3',
    loadComponent: () => import('./pages/intro3/intro3.page').then( m => m.Intro3Page)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'intro2',
    loadComponent: () => import('./pages/intro2/intro2.page').then( m => m.Intro2Page)
  },
  {
    path: 'confir',
    loadComponent: () => import('./pages/confir/confir.page').then( m => m.ConfirPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.page').then( m => m.PerfilPage)
  },
  {
    path: 'puntos',
    loadComponent: () => import('./pages/puntos/puntos.page').then( m => m.PuntosPage)
  },
];
