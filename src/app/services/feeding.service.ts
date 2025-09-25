import { Injectable } from '@angular/core';
import { Profile } from '../models/profile.model';

export interface FeedingResult {
  grams: number;
  scoops: number;
  paseo: number;
  edadHumana: string;
}

interface FeedingConfig {
  etapa: string;
  sexo: string; // 'Macho', 'Hembra' o 'Ambos'
  pesoMin: number;
  pesoMax: number;
  gramsMin: number;
  gramsMax: number;
  paseoMin: number;
  paseoMax: number;
  edadHumana: string;
}

@Injectable({ providedIn: 'root' })
export class FeedingService {
  // Configuración completa basada en tu Word
  private data: Record<string, FeedingConfig[]> = {
    'Mestizo': [
      { etapa: 'Adulto joven', sexo: 'Pequeño', pesoMin: 5, pesoMax: 10, gramsMin: 100, gramsMax: 180, paseoMin: 30, paseoMax: 45, edadHumana: '15–45 años' },
      { etapa: 'Adulto joven', sexo: 'Mediano', pesoMin: 10, pesoMax: 25, gramsMin: 180, gramsMax: 300, paseoMin: 45, paseoMax: 60, edadHumana: '15–45 años' },
      { etapa: 'Adulto joven', sexo: 'Grande', pesoMin: 25, pesoMax: 40, gramsMin: 300, gramsMax: 500, paseoMin: 60, paseoMax: 90, edadHumana: '15–45 años' },
    ],
    'Labrador Retriever': [
      { etapa: 'Cachorro', sexo: 'Macho', pesoMin: 8, pesoMax: 25, gramsMin: 250, gramsMax: 450, paseoMin: 20, paseoMax: 40, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Macho', pesoMin: 29, pesoMax: 36, gramsMin: 400, gramsMax: 550, paseoMin: 60, paseoMax: 90, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Macho', pesoMin: 25, pesoMax: 30, gramsMin: 350, gramsMax: 450, paseoMin: 45, paseoMax: 60, edadHumana: '>50 años' },
      { etapa: 'Cachorro', sexo: 'Hembra', pesoMin: 7, pesoMax: 23, gramsMin: 230, gramsMax: 420, paseoMin: 20, paseoMax: 35, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Hembra', pesoMin: 25, pesoMax: 32, gramsMin: 370, gramsMax: 500, paseoMin: 60, paseoMax: 80, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Hembra', pesoMin: 22, pesoMax: 28, gramsMin: 320, gramsMax: 420, paseoMin: 40, paseoMax: 60, edadHumana: '>50 años' },
    ],
    'Golden Retriever': [
      { etapa: 'Cachorro', sexo: 'Macho', pesoMin: 7, pesoMax: 24, gramsMin: 240, gramsMax: 430, paseoMin: 20, paseoMax: 40, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Macho', pesoMin: 29, pesoMax: 34, gramsMin: 380, gramsMax: 520, paseoMin: 60, paseoMax: 90, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Macho', pesoMin: 25, pesoMax: 30, gramsMin: 330, gramsMax: 450, paseoMin: 45, paseoMax: 60, edadHumana: '>50 años' },
      { etapa: 'Cachorro', sexo: 'Hembra', pesoMin: 6, pesoMax: 22, gramsMin: 220, gramsMax: 400, paseoMin: 20, paseoMax: 35, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Hembra', pesoMin: 25, pesoMax: 32, gramsMin: 350, gramsMax: 480, paseoMin: 55, paseoMax: 80, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Hembra', pesoMin: 22, pesoMax: 27, gramsMin: 300, gramsMax: 420, paseoMin: 40, paseoMax: 55, edadHumana: '>50 años' },
    ],
    'Bulldog': [
      { etapa: 'Cachorro', sexo: 'Macho', pesoMin: 5, pesoMax: 15, gramsMin: 160, gramsMax: 300, paseoMin: 10, paseoMax: 20, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Macho', pesoMin: 22, pesoMax: 25, gramsMin: 280, gramsMax: 400, paseoMin: 20, paseoMax: 30, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Macho', pesoMin: 20, pesoMax: 22, gramsMin: 250, gramsMax: 350, paseoMin: 15, paseoMax: 25, edadHumana: '>50 años' },
      { etapa: 'Cachorro', sexo: 'Hembra', pesoMin: 5, pesoMax: 14, gramsMin: 150, gramsMax: 280, paseoMin: 10, paseoMax: 20, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Hembra', pesoMin: 18, pesoMax: 23, gramsMin: 250, gramsMax: 370, paseoMin: 20, paseoMax: 30, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Hembra', pesoMin: 17, pesoMax: 20, gramsMin: 220, gramsMax: 330, paseoMin: 15, paseoMax: 25, edadHumana: '>50 años' },
    ],
    'Poodle': [
      { etapa: 'Adulto joven', sexo: 'Toy', pesoMin: 2, pesoMax: 4, gramsMin: 50, gramsMax: 90, paseoMin: 20, paseoMax: 30, edadHumana: '15–45 años' },
      { etapa: 'Adulto joven', sexo: 'Mini', pesoMin: 5, pesoMax: 9, gramsMin: 90, gramsMax: 160, paseoMin: 30, paseoMax: 40, edadHumana: '15–45 años' },
      { etapa: 'Adulto joven', sexo: 'Estándar', pesoMin: 20, pesoMax: 32, gramsMin: 300, gramsMax: 500, paseoMin: 45, paseoMax: 60, edadHumana: '15–45 años' },
    ],
    'Beagle': [
      { etapa: 'Cachorro', sexo: 'Macho', pesoMin: 3, pesoMax: 10, gramsMin: 120, gramsMax: 220, paseoMin: 15, paseoMax: 30, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Macho', pesoMin: 10, pesoMax: 11, gramsMin: 180, gramsMax: 220, paseoMin: 60, paseoMax: 60, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Macho', pesoMin: 9, pesoMax: 10, gramsMin: 150, gramsMax: 180, paseoMin: 45, paseoMax: 45, edadHumana: '>50 años' },
      { etapa: 'Cachorro', sexo: 'Hembra', pesoMin: 3, pesoMax: 9, gramsMin: 110, gramsMax: 200, paseoMin: 15, paseoMax: 25, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Hembra', pesoMin: 9, pesoMax: 10, gramsMin: 170, gramsMax: 200, paseoMin: 50, paseoMax: 60, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Hembra', pesoMin: 8, pesoMax: 9, gramsMin: 140, gramsMax: 170, paseoMin: 40, paseoMax: 50, edadHumana: '>50 años' },
    ],
    'Pastor Alemán': [
      { etapa: 'Cachorro', sexo: 'Macho', pesoMin: 10, pesoMax: 28, gramsMin: 300, gramsMax: 600, paseoMin: 25, paseoMax: 40, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Macho', pesoMin: 30, pesoMax: 40, gramsMin: 450, gramsMax: 650, paseoMin: 90, paseoMax: 90, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Macho', pesoMin: 28, pesoMax: 35, gramsMin: 380, gramsMax: 520, paseoMin: 60, paseoMax: 60, edadHumana: '>50 años' },
      { etapa: 'Cachorro', sexo: 'Hembra', pesoMin: 9, pesoMax: 26, gramsMin: 280, gramsMax: 550, paseoMin: 20, paseoMax: 35, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Hembra', pesoMin: 22, pesoMax: 32, gramsMin: 400, gramsMax: 600, paseoMin: 70, paseoMax: 80, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Hembra', pesoMin: 20, pesoMax: 28, gramsMin: 350, gramsMax: 480, paseoMin: 55, paseoMax: 70, edadHumana: '>50 años' },
    ],
    'Chihuahua': [
      { etapa: 'Cachorro', sexo: 'Ambos', pesoMin: 0.8, pesoMax: 2, gramsMin: 40, gramsMax: 70, paseoMin: 10, paseoMax: 15, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Ambos', pesoMin: 1.5, pesoMax: 3, gramsMin: 50, gramsMax: 90, paseoMin: 20, paseoMax: 20, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Ambos', pesoMin: 1.5, pesoMax: 2.8, gramsMin: 45, gramsMax: 70, paseoMin: 15, paseoMax: 15, edadHumana: '>50 años' },
    ],
    'Shih Tzu': [
      { etapa: 'Cachorro', sexo: 'Ambos', pesoMin: 2, pesoMax: 5, gramsMin: 100, gramsMax: 180, paseoMin: 10, paseoMax: 20, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Ambos', pesoMin: 4, pesoMax: 7, gramsMin: 140, gramsMax: 240, paseoMin: 30, paseoMax: 30, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Ambos', pesoMin: 4, pesoMax: 6, gramsMin: 120, gramsMax: 200, paseoMin: 20, paseoMax: 25, edadHumana: '>50 años' },
    ],
    'Rottweiler': [
      { etapa: 'Cachorro', sexo: 'Macho', pesoMin: 12, pesoMax: 35, gramsMin: 400, gramsMax: 800, paseoMin: 25, paseoMax: 45, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Macho', pesoMin: 45, pesoMax: 60, gramsMin: 700, gramsMax: 1100, paseoMin: 90, paseoMax: 90, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Macho', pesoMin: 40, pesoMax: 55, gramsMin: 600, gramsMax: 900, paseoMin: 60, paseoMax: 60, edadHumana: '>50 años' },
      { etapa: 'Cachorro', sexo: 'Hembra', pesoMin: 10, pesoMax: 32, gramsMin: 350, gramsMax: 700, paseoMin: 20, paseoMax: 40, edadHumana: '0–15 años' },
      { etapa: 'Adulto joven', sexo: 'Hembra', pesoMin: 35, pesoMax: 48, gramsMin: 600, gramsMax: 950, paseoMin: 70, paseoMax: 80, edadHumana: '15–45 años' },
      { etapa: 'Mayor', sexo: 'Hembra', pesoMin: 32, pesoMax: 42, gramsMin: 500, gramsMax: 800, paseoMin: 55, paseoMax: 70, edadHumana: '>50 años' },
    ],
  };

  calculate(profile: Profile): FeedingResult {
    const raza = this.data[profile.raza];
    if (!raza) {
      return { grams: 200, scoops: 4, paseo: 30, edadHumana: '-' };
    }

    // Para simplificar: usamos solo edad → etapa
    let etapa = 'Adulto joven';
    if (profile.edad === 0) etapa = 'Cachorro';
    else if (profile.edad > 7) etapa = 'Mayor';

    const match = raza.find(r => r.etapa === etapa);
    if (!match) return { grams: 200, scoops: 4, paseo: 30, edadHumana: '-' };

    const grams = Math.round((match.gramsMin + match.gramsMax) / 2);
    const paseo = Math.round((match.paseoMin + match.paseoMax) / 2);
    return {
      grams,
      scoops: Math.round(grams / 50),
      paseo,
      edadHumana: match.edadHumana,
    };
  }
}
