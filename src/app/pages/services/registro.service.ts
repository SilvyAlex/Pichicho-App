import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export async function guardarRegistro(payload: any): Promise<void> {
  let fotoUrl = null;

  if (payload.foto) {
    const fotoRef = ref(storage, `fotos/${Date.now()}.jpg`);
    await uploadString(fotoRef, payload.foto, 'data_url');
    fotoUrl = await getDownloadURL(fotoRef);
  }

  const registro = {
    nombreNino: payload.nombreNino,
    nombrePerro: payload.nombrePerro,
    peso: payload.peso,
    raza: payload.raza,
    edad: payload.edad,
    correoAdulto: payload.correoAdulto,
    fotoUrl
  };

  await addDoc(collection(db, 'registros'), registro);
}