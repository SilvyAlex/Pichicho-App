import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  heartOutline,
  personOutline,
  closeOutline,
  downloadOutline,
  volumeHighOutline,
} from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { FirebaseService } from '../../services/firebase';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonButton, CommonModule, FormsModule],
})
export class PerfilPage implements OnInit, OnDestroy {
  userName = '';
  petName = '';
  petPhoto: string | null = null;
  petLevel = 1;
  allPhotos: string[] = [];
  selectedImage: string | null = null;

  constructor(
    private router: Router,
    private session: SessionService,
    private firebaseSvc: FirebaseService,
    private firestore: Firestore
  ) {
    addIcons({
      homeOutline,
      heartOutline,
      personOutline,
      closeOutline,
      downloadOutline,
      volumeHighOutline,
    });
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (!profile) return;

    this.userName = profile.nombreNino;
    this.petName = profile.nombrePerro;
    this.petPhoto =
      (profile as any)?.fotoPerfil ||
      (profile as any)?.fotoUrl ||
      'assets/images/SiDog.png';

    this.petLevel = this.calculateLevel(profile.puntos || 0);

    const refDoc = doc(this.firestore, 'registros', profile.id);
    const snap = await getDoc(refDoc);
    if (snap.exists()) {
      const data = snap.data() as any;
      const fotosComida = (data.evidenciasComida || []).map(
        (e: any) => e.foto || e.url
      );
      const fotosPaseo = (data.evidenciasPaseo || []).map(
        (e: any) => e.foto || e.url
      );
      const fotosEntrenamiento = (data.evidenciasEntrenamiento || []).map(
        (e: any) => e.foto || e.url
      );
      this.allPhotos = [
        ...fotosComida,
        ...fotosPaseo,
        ...fotosEntrenamiento,
      ].filter(Boolean);
    }
  }

  ngOnDestroy() {
    this.stopSpeech();
  }

  calculateLevel(puntos: number): number {
    if (puntos < 50) return 1;
    if (puntos < 100) return 2;
    if (puntos < 200) return 3;
    return 4;
  }

  openFullImage(photo: string | null) {
    if (photo) this.selectedImage = photo;
  }

  closeImage() {
    this.selectedImage = null;
  }

  /** 💾 Descargar imagen */
  downloadImage(url: string) {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evidencia.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  goTo(path: string) {
    this.router.navigateByUrl(path);
  }

  /** 🗣 Texto que debe leer el botón de audio */
  private buildMainAudioText(): string {
    const nombre = this.userName || 'tu cuidador';
    const mascota = this.petName || 'tu mascota';

    // Hasta "Galería de evidencias"
    return `Perfil de ${nombre}. Mascota: ${mascota}. Galería de evidencias.`;
  }

  /** 👉 Botón de audio superior */
  async onMainAudio() {
    const text = this.buildMainAudioText();
    await this.speak(text);
  }

  /** 🔊 Hablar (web + nativo) */
  private async speak(text: string) {
    if (!text) return;

    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      const hasWebSpeech =
        'speechSynthesis' in window &&
        typeof (window as any).SpeechSynthesisUtterance !== 'undefined';

      if (!hasWebSpeech) {
        console.warn('SpeechSynthesis no está disponible en este navegador.');
        return;
      }

      (window as any).speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;

      (window as any).speechSynthesis.speak(utterance);
    } else {
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({
          text,
          lang: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (err) {
        console.error('Error al usar TextToSpeech:', err);
      }
    }
  }

  /** 🧹 Detener lectura al salir */
  private stopSpeech() {
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
      if ('speechSynthesis' in window) {
        (window as any).speechSynthesis.cancel();
      }
    } else {
      TextToSpeech.stop().catch(() => {});
    }
  }
}
