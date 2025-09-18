import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { ref, uploadString, getDownloadURL, Storage } from '@angular/fire/storage';

export interface RegistroPayload {
  nombreNino: string;
  nombrePerro: string;
  peso: string;
  raza: string;
  edad: number;
  correoAdulto: string;
  foto?: string | null; // DataURL opcional (base64)
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /** Sube una imagen (DataURL/base64) a Storage y devuelve la URL pública */
  async uploadPhotoFromDataUrl(dataUrl: string, nombrePerro: string): Promise<string> {
    const safeName = (nombrePerro || 'peludito').trim().replace(/\s+/g, '_').toLowerCase();
    const filePath = `registros/${safeName}_${Date.now()}.jpg`;
    const storageRef = ref(this.storage, filePath);

    // Sube el DataURL directamente
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }

  /** Guarda el documento del registro en Firestore */
  async saveRegistro(data: Omit<RegistroPayload, 'foto'> & { fotoUrl?: string | null }) {
    const colRef = collection(this.firestore, 'registros');
    return await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  }
}