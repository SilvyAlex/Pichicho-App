import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  heartOutline,
  personOutline,
  closeOutline,
  downloadOutline,
} from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { FirebaseService } from '../../services/firebase';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule],
})
export class PerfilPage implements OnInit {
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
      const fotosComida = (data.evidenciasComida || []).map((e: any) => e.foto || e.url);
      const fotosPaseo = (data.evidenciasPaseo || []).map((e: any) => e.foto || e.url);
      const fotosEntrenamiento = (data.evidenciasEntrenamiento || []).map((e: any) => e.foto || e.url);
      this.allPhotos = [...fotosComida, ...fotosPaseo, ...fotosEntrenamiento].filter(Boolean);
    }
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
}
