import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { ref, uploadString, getDownloadURL, Storage } from '@angular/fire/storage';

export interface RegistroPayload {
  nombreNino: string;
  nombrePerro: string;
  peso: number;
  raza: string;
  edad: number;
  correoAdulto: string;
  foto?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /** 📸 Subir foto de perfil */
  async uploadProfilePhoto(dataUrl: string, nombrePerro: string): Promise<string> {
    const safeName = (nombrePerro || 'peludito').trim().replace(/\s+/g, '_').toLowerCase();
    const filePath = `registros/${safeName}_${Date.now()}.jpg`;
    const storageRef = ref(this.storage, filePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }

  /** 📸 Subir foto de evidencia */
  async uploadEvidencePhoto(dataUrl: string, nombrePerro: string): Promise<string> {
    const safeName = (nombrePerro || 'peludito').trim().replace(/\s+/g, '_').toLowerCase();
    const filePath = `evidencias/${safeName}_${Date.now()}.jpg`;
    const storageRef = ref(this.storage, filePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }

  /** 📝 Guardar registro inicial (perfil del niño y perrito) */
  async saveRegistro(data: Omit<RegistroPayload, 'foto'> & { fotoUrl?: string | null }) {
    const colRef = collection(this.firestore, 'registros');
    return await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      puntos: 0,          // inicia con 0 puntos
      evidencias: [],     // inicia sin evidencias
      ultimoBano: null,
      proximoBano: null
    });
  }

  /** 🔄 Actualizar fechas de baño */
  async updateBathDates(profileId: string, ultimo: Date, proximo: Date) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    await updateDoc(refDoc, {
      ultimoBano: ultimo,
      proximoBano: proximo,
      updatedAt: serverTimestamp()
    });
  }

  /** Obtener fechas de baño */
  /** Actualiza historial de baños (acumula fechas) */
async addBathDate(profileId: string, fecha: Date, proximo: Date) {
  const refDoc = doc(this.firestore, 'registros', profileId);
  const snap = await getDoc(refDoc);
  let banos: Date[] = [];
  if (snap.exists()) {
    const data = snap.data() as any;
    banos = (data.banos || []).map((f: any) => f.toDate ? f.toDate() : new Date(f));
  }
  banos.push(fecha); // acumula la nueva fecha
  await updateDoc(refDoc, {
    banos,
    proximoBano: proximo,
    updatedAt: serverTimestamp()
  });
}

/** Obtener historial de baños */
async getBathHistory(profileId: string): Promise<{ banos: Date[]; proximoBano?: Date }> {
  const refDoc = doc(this.firestore, 'registros', profileId);
  const snap = await getDoc(refDoc);
  if (snap.exists()) {
    const data = snap.data() as any;
    return {
      banos: (data.banos || []).map((f: any) => f.toDate ? f.toDate() : new Date(f)),
      proximoBano: data.proximoBano?.toDate?.()
    };
  }
  return { banos: [] };
}
}
