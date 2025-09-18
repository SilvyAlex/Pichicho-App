import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

import { FirebaseService } from '../../services/firebase';   // 👈 servicio Firestore/Storage
import { SessionService } from '../../services/session';     // 👈 sesión (Preferences)
import { Profile } from '../../models/profile.model';                // 👈 interface de perfil

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage {
  form: FormGroup;
  photoDataUrl: string | null = null;

  pesos = ['< 5 kg', '5 – 10 kg', '10 – 20 kg', '20 – 30 kg', '> 30 kg'];

  razas = [
    'Mestizo', 'Labrador Retriever', 'Golden Retriever', 'Bulldog',
    'Poodle', 'Beagle', 'Pastor Alemán', 'Chihuahua', 'Shih Tzu', 'Rottweiler'
  ];

  edades: number[] = Array.from({ length: 21 }, (_, i) => i); // 0..20

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.form = this.fb.group({
      nombreNino: ['', [Validators.required, Validators.minLength(2)]],
      nombrePerro: ['', [Validators.required, Validators.minLength(2)]],
      peso: ['', Validators.required],
      raza: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(0), Validators.max(20)]],
      correoAdulto: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
        ]
      ],
      foto: [null]
    });
  }

  // Abrir selector de archivos
  triggerFilePicker(input: HTMLInputElement) {
    input.click();
  }

  // Guardar y previsualizar foto
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.photoDataUrl = reader.result as string;
      this.form.patchValue({ foto: this.photoDataUrl });
    };
    reader.readAsDataURL(file);
  }

  // Envío: sube foto (si hay), guarda en Firestore, guarda sesión y navega
  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    try {
      const { foto, ...rest } = this.form.value;
      let fotoUrl: string | null = null;

      // 1) Subir imagen a Storage (si el usuario seleccionó una)
      if (this.photoDataUrl) {
        fotoUrl = await this.firebaseSvc.uploadPhotoFromDataUrl(
          this.photoDataUrl,
          (this.form.value.nombrePerro || 'peludito').toString()
        );
      }

      // 2) Guardar documento en Firestore y obtener docId
      const docRef = await this.firebaseSvc.saveRegistro({
        ...rest,
        fotoUrl,
      });

      // 3) Persistir perfil en la sesión (Preferences) para toda la app
      const profile: Profile = {
        id: docRef.id,
        ...rest,
        fotoUrl,
      };
      await this.session.setProfile(profile);

      // 4) UI feedback + navegar
      await loading.dismiss();
      const ok = await this.toastCtrl.create({
        message: '¡Registro guardado con éxito!',
        duration: 1800,
        icon: 'checkmark-circle',
      });
      await ok.present();

      this.router.navigate(['/intro2']);

    } catch (err) {
      console.error(err);
      await loading.dismiss();
      const t = await this.toastCtrl.create({
        message: 'Ocurrió un error al guardar. Intenta de nuevo.',
        duration: 2200,
        color: 'danger',
        icon: 'alert-circle',
      });
      await t.present();
    }
  }

  // (opcional) ya no lo uses en el botón; se navega tras guardar
  goToIntro2() {
    this.router.navigate(['/intro2']);
  }

  ngOnInit() {}
}
