export interface Profile {
  id: string;               // id del documento en Firestore
  nombreNino: string;
  nombrePerro: string;
  peso: string;
  raza: string;
  edad: number;
  correoAdulto: string;
  fotoUrl?: string | null;
}