import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, personCircleOutline } from 'ionicons/icons';
import { SessionService } from '../../services/session';
import { FirebaseService } from '../../services/firebase';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule]
})
export class PerfilPage implements OnInit {
  userName = '';
  petName = '';
  petPhoto: string | null = null;
  petLevel = 1;
  allPhotos: string[] = [];

  constructor(
    private session: SessionService,
    private firebaseSvc: FirebaseService,
    private firestore: Firestore
  ) {
    addIcons({ homeOutline, personCircleOutline });
  }

  async ngOnInit() {
    const profile = this.session.snapshot;
    if (!profile) return;

    // 🧒 Datos básicos
    this.userName = profile.nombreNino;
    this.petName = profile.nombrePerro;

    // 🐶 Foto principal: usa la del registro (fotoUrl)
    this.petPhoto =
      (profile as any).fotoUrl ||
      (profile as any).foto ||
      'assets/images/default-dog.png';

    // 🏅 Nivel según puntos
    this.petLevel = this.calculateLevel(profile.puntos || 0);

    // 📸 Unir todas las evidencias (comida, paseo, entrenamiento)
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

  /** Calcula nivel según puntos */
  calculateLevel(puntos: number): number {
    if (puntos < 50) return 1;
    if (puntos < 100) return 2;
    if (puntos < 200) return 3;
    return 4;
  }
}
