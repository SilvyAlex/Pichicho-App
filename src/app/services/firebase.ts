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
  fotoPerfil?: string | null; // 👈 nuevo campo más claro
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(private firestore: Firestore, private storage: Storage) {}

  // --------------------------------------------------------
  // 🐾 PERFIL Y SUBIDA DE FOTOS
  // --------------------------------------------------------

  async uploadProfilePhoto(dataUrl: string, nombrePerro: string): Promise<string> {
    const safeName = (nombrePerro || 'peludito').trim().replace(/\s+/g, '_').toLowerCase();
    const filePath = `registros/${safeName}_${Date.now()}.jpg`;
    const storageRef = ref(this.storage, filePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }

  async uploadEvidencePhoto(dataUrl: string, nombrePerro: string): Promise<string> {
    const safeName = (nombrePerro || 'peludito').trim().replace(/\s+/g, '_').toLowerCase();
    const filePath = `evidencias/${safeName}_${Date.now()}.jpg`;
    const storageRef = ref(this.storage, filePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }

  // --------------------------------------------------------
  // 🧾 REGISTRO DEL PERFIL
  // --------------------------------------------------------

  async saveRegistro(data: Omit<RegistroPayload, 'foto'> & { fotoPerfil?: string | null }) {
    const colRef = collection(this.firestore, 'registros');
    return await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      puntos: 0,
      evidencias: [],
      evidenciasComida: [],
      evidenciasPaseo: [],
      evidenciasEntrenamiento: [],
      banos: [],
      ultimoBano: null,
      proximoBano: null,
      vacunas: []
    });
  }

  // --------------------------------------------------------
  // 🛁 LIMPIEZA (BAÑOS)
  // --------------------------------------------------------

  async addBathDate(profileId: string, fecha: Date, proximo: Date) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;

    const data = snap.data() as any;
    const banos = (data.banos || []).map((f: any) => (f.toDate ? f.toDate() : new Date(f)));

    const normalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    banos.push(normalizada);

    const nuevosPuntos = (data.puntos || 0) + 10; // 💧 +10 puntos

    await updateDoc(refDoc, {
      banos,
      proximoBano: proximo,
      puntos: nuevosPuntos,
      updatedAt: serverTimestamp()
    });
  }

  async getBathHistory(profileId: string): Promise<{ banos: Date[]; proximoBano?: Date }> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return { banos: [] };

    const data = snap.data() as any;
    return {
      banos: (data.banos || []).map((f: any) => (f.toDate ? f.toDate() : new Date(f))),
      proximoBano: data.proximoBano?.toDate?.()
    };
  }

  async getBathStatus(profileId: string): Promise<{ hasBath: boolean }> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return { hasBath: false };

    const data = snap.data() as any;
    return { hasBath: (data.banos || []).length > 0 };
  }

  // --------------------------------------------------------
  // 💉 VACUNAS
  // --------------------------------------------------------

  async addVaccine(profileId: string, vacuna: { tipo: string; fechaVacunacion: string; fechaRefuerzo: string }) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;

    const data = snap.data() as any;
    const nuevosPuntos = (data.puntos || 0) + 10; // 💉 +10 puntos

    await updateDoc(refDoc, {
      vacunas: arrayUnion(vacuna),
      puntos: nuevosPuntos,
      updatedAt: serverTimestamp()
    });
  }

  async getVaccineHistory(profileId: string): Promise<any[]> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return [];
    return (snap.data() as any).vacunas || [];
  }

  async getVaccineStatus(profileId: string): Promise<{ hasVaccine: boolean }> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return { hasVaccine: false };
    const data = snap.data() as any;
    return { hasVaccine: (data.vacunas || []).length > 0 };
  }

  // --------------------------------------------------------
  // 🦴 EVIDENCIAS (COMIDA, PASEO, ENTRENAMIENTO)
  // --------------------------------------------------------

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
    }

    const nuevosPuntos = (data.puntos || 0) + puntosExtra;

    await updateDoc(refDoc, {
      [field]: arrayUnion({ foto: fotoUrl, fecha: new Date() }),
      puntos: nuevosPuntos,
      updatedAt: serverTimestamp()
    });
  }

  // --------------------------------------------------------
  // 🍗 COMIDA
  // --------------------------------------------------------

  async getDailyFeedStatus(profileId: string, date: Date = new Date()): Promise<{ morningFed: boolean; eveningFed: boolean }> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return { morningFed: false, eveningFed: false };

    const data = snap.data() as any;
    const target = date.toDateString();

    const evidencias = (data.evidenciasComida || []).filter((e: any) => {
      const fecha = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha);
      return fecha.toDateString() === target;
    });

    const morningFed = evidencias.some((e: any) => {
      const h = (e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)).getHours();
      return h >= 4 && h < 12;
    });

    const eveningFed = evidencias.some((e: any) => {
      const h = (e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)).getHours();
      return h >= 12 && h < 22;
    });

    return { morningFed, eveningFed };
  }

  // --------------------------------------------------------
  // 🐾 PASEOS
  // --------------------------------------------------------

  async getDailyWalkStatus(profileId: string, date: Date = new Date()): Promise<{ morningWalked: boolean; eveningWalked: boolean }> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return { morningWalked: false, eveningWalked: false };

    const data = snap.data() as any;
    const evidencias = (data.evidenciasPaseo || []).map((e: any) =>
      e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
    );

    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    let morningWalked = false;
    let eveningWalked = false;

    for (const ev of evidencias) {
      const fecha = new Date(ev);
      if (fecha >= todayStart && fecha <= todayEnd) {
        const h = fecha.getHours();
        if (h >= 4 && h < 12) morningWalked = true;
        if (h >= 12 && h < 22) eveningWalked = true;
      }
    }

    return { morningWalked, eveningWalked };
  }

  // --------------------------------------------------------
  // 🎮 ENTRENAMIENTOS
  // --------------------------------------------------------

  async getDailyTrainingStatus(profileId: string, date: Date = new Date()): Promise<{ trainedToday: boolean; activityId?: string }> {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return { trainedToday: false };

    const data = snap.data() as any;
    const evidencias = (data.evidenciasEntrenamiento || []).map((e: any) => ({
      fecha: e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha),
      actividadId: e.actividadId || null
    }));

    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const evidenciaHoy = evidencias.find((f: any) => f.fecha >= todayStart && f.fecha <= todayEnd);

    return { trainedToday: !!evidenciaHoy, activityId: evidenciaHoy?.actividadId || null };
  }

  async addTrainingEvidence(profileId: string, actividadId: string) {
    const refDoc = doc(this.firestore, 'registros', profileId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;

    const data = snap.data() as any;
    const nuevosPuntos = (data.puntos || 0) + 15;

    await updateDoc(refDoc, {
      evidenciasEntrenamiento: arrayUnion({ actividadId, fecha: new Date() }),
      puntos: nuevosPuntos,
      updatedAt: serverTimestamp()
    });
  }

  // --------------------------------------------------------
  // 📘 ENTRENAMIENTOS DESDE BASE DE DATOS
  // --------------------------------------------------------

  async getEntrenamientoById(id: string): Promise<any | null> {
    const refDoc = doc(this.firestore, 'entrenamientos', id);
    const snap = await getDoc(refDoc);
    return snap.exists() ? snap.data() : null;
  }

  async getEntrenamientos(): Promise<any[]> {
    const colRef = collection(this.firestore, 'entrenamientos');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
