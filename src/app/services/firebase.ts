import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  getDocs
} from '@angular/fire/firestore';
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

  /** 📝 Guardar registro inicial */
  async saveRegistro(data: Omit<RegistroPayload, 'foto'> & { fotoUrl?: string | null }) {
    const colRef = collection(this.firestore, 'registros');
    return await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      puntos: 0,
      evidencias: [],
      ultimoBano: null,
      proximoBano: null,
      banos: [],
      evidenciasComida: [],
      evidenciasPaseo: [],
      evidenciasEntrenamiento: [],
      vacunas: []
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

  /** ➕ Agregar una fecha al historial de baños */
  async addBathDate(profileId: string, fecha: Date, proximo: Date) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    let banos: Date[] = [];
    if (snap.exists()) {
      const data = snap.data() as any;
      banos = (data.banos || []).map((f: any) => f.toDate ? f.toDate() : new Date(f));
    }
    banos.push(fecha);
    await updateDoc(refDoc, {
      banos,
      proximoBano: proximo,
      updatedAt: serverTimestamp()
    });
  }

  /** 📖 Obtener historial de baños */
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

  /** 🐾 Guardar evidencia tipo foto */
  async addEvidenceDate(profileId: string, tipo: string, fotoUrl: string) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;

    const data = snap.data() as any;
    let puntosExtra = 0;
    let field = 'evidencias';

    switch (tipo) {
      case 'comida':
        field = 'evidenciasComida';
        puntosExtra = 5;
        break;
      case 'paseo':
        field = 'evidenciasPaseo';
        puntosExtra = 10;
        break;
      case 'entrenamiento':
        field = 'evidenciasEntrenamiento';
        puntosExtra = 15;
        break;
      default:
        field = 'evidencias';
    }

    const nuevosPuntos = (data.puntos || 0) + puntosExtra;

    await updateDoc(refDoc, {
      [field]: arrayUnion({
        foto: fotoUrl,
        fecha: new Date()
      }),
      puntos: nuevosPuntos,
      updatedAt: serverTimestamp()
    });
  }

  /** ➕ Agregar vacuna */
  async addVaccine(profileId: string, vacuna: { tipo: string; fechaVacunacion: string; fechaRefuerzo: string }) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    await updateDoc(refDoc, {
      vacunas: arrayUnion(vacuna),
      updatedAt: serverTimestamp()
    });
  }

  /** 📖 Obtener historial de vacunas */
  async getVaccineHistory(profileId: string): Promise<any[]> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (snap.exists()) {
      const data = snap.data() as any;
      return data.vacunas || [];
    }
    return [];
  }

  /** 📘 Obtener entrenamiento por ID */
  async getEntrenamientoById(id: string): Promise<any | null> {
    const refDoc = doc(this.firestore, 'entrenamientos', id);
    const snap = await getDoc(refDoc);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  }

  /** 📚 Obtener todos los entrenamientos */
  async getEntrenamientos(): Promise<any[]> {
    const colRef = collection(this.firestore, 'entrenamientos');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
