export interface Profile {
  id: string;               // id del documento en Firestore
  nombreNino: string;
  nombrePerro: string;
  peso: number;
  raza: string;
  edad: number;
  correoAdulto: string;
  fotoUrl?: string | null;
  puntos?: number;
  evidencias?: string[];
}