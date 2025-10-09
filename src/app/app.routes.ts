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
  {
    path: 'comida1',
    loadComponent: () => import('./pages/comida1/comida1.page').then( m => m.Comida1Page)
  },
  {
    path: 'paseos1',
    loadComponent: () => import('./pages/paseos1/paseos1.page').then( m => m.Paseos1Page)
  },
  {
    path: 'vacunas',
    loadComponent: () => import('./pages/vacunas/vacunas.page').then( m => m.VacunasPage)
  },
  {
    path: 'limpieza',
    loadComponent: () => import('./pages/limpieza/limpieza.page').then( m => m.LimpiezaPage)
  },
  {
    path: 'comida2',
    loadComponent: () => import('./pages/comida2/comida2.page').then( m => m.Comida2Page)
  },
  {
    path: 'paseos2',
    loadComponent: () => import('./pages/paseos2/paseos2.page').then( m => m.Paseos2Page)
  },
  {
    path: 'paseos3',
    loadComponent: () => import('./pages/paseos3/paseos3.page').then( m => m.Paseos3Page)
  },
  {
    path: 'entrena1',
    loadComponent: () => import('./pages/entrena1/entrena1.page').then( m => m.Entrena1Page)
  },
  {
    path: 'entrena2/:id',
    loadComponent: () => import('./pages/entrena2/entrena2.page').then( m => m.Entrena2Page)
  },
  {
    path: 'entrena3',
    loadComponent: () => import('./pages/entrena3/entrena3.page').then( m => m.Entrena3Page)
  },
];
