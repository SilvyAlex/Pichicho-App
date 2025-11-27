import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { FirebaseService } from '../../services/firebase';
import { SessionService } from '../../services/session';
import { Profile } from '../../models/profile.model';

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

  pesos: number[] = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

  razas = [
    'Mestizo', 'Labrador Retriever', 'Golden Retriever', 'Bulldog',
    'Poodle', 'Beagle', 'Pastor Alemán', 'Chihuahua', 'Shih Tzu', 'Rottweiler'
  ];

  edades: number[] = Array.from({ length: 21 }, (_, i) => i);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firebaseSvc: FirebaseService,
    private session: SessionService,
    private toastCtrl: ToastController,
    // private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    this.form = this.fb.group({
      nombreNino: ['', [Validators.required, Validators.minLength(2)]],
      nombrePerro: ['', [Validators.required, Validators.minLength(2)]],
      peso: [null, [Validators.required]],
      raza: ['', Validators.required],
      edad: [null, [Validators.required]],
      correoAdulto: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
        ]
      ],
      // 👇 Foto opcional: sin Validators.required
      foto: [null]
    });
  }

  // 📸 Abrir selector de archivos
  triggerFilePicker(input: HTMLInputElement) {
    input.click();
  }

  // 📸 Guardar y previsualizar foto
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

  // 🚨 Mostrar alerta personalizada
  async showAlert(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: '¡Falta información!',
      message: mensaje,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  // 🧩 Envío: validar, subir foto (si hay), guardar y navegar
  async onSubmit() {
  if (!this.form.valid) {
    this.form.markAllAsTouched();

    const errores: string[] = [];

    if (this.form.get('nombreNino')?.hasError('required')) errores.push('Tu nombre');
    if (this.form.get('nombrePerro')?.hasError('required')) errores.push('El nombre del perrito');
    if (this.form.get('peso')?.hasError('required')) errores.push('El peso del perrito');
    if (this.form.get('raza')?.hasError('required')) errores.push('La raza del perrito');
    if (this.form.get('edad')?.hasError('required')) errores.push('La edad del perrito');
    if (this.form.get('correoAdulto')?.hasError('required')) errores.push('El correo del adulto');
    if (this.form.get('correoAdulto')?.hasError('pattern')) errores.push('El formato del correo es inválido');

    let mensaje = '';
    if (errores.length === 1) {
      mensaje = `Debes completar: ${errores[0]}.`;
    } else if (errores.length > 1) {
      mensaje = `Debes completar los siguientes campos:<br>- ${errores.join('<br>- ')}`;
    }

    await this.showAlert(mensaje || 'Por favor completa todos los campos.');
    return;
  }

  console.log({value: this.form.value});
  console.log({photoDataUrl: this.photoDataUrl});

  // const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
  // console.log("🚀 ~ RegistroPage ~ onSubmit ~ loading:", loading)
  // await loading.present();

  try {
    const { foto, ...rest } = this.form.value;
    let fotoUrl: string | null = null;

    // 1️⃣ Intentar subir imagen SOLO si hay foto,
    //    pero si falla, seguimos sin romper el registro
    if (this.photoDataUrl) {
      try {
        fotoUrl = await this.firebaseSvc.uploadProfilePhoto(
          this.photoDataUrl,
          (this.form.value.nombrePerro || 'peludito').toString()
        );
      } catch (e) {
        console.warn('No se pudo subir la foto, continúo sin fotoPerfil', e);
        fotoUrl = null;
      }
    }

    // 2️⃣ Guardar registro en Firestore
    const docRef = await this.firebaseSvc.saveRegistro({
      ...rest,
      fotoPerfil: fotoUrl,
      puntos: 0,
      evidencias: []
    });

    // 3️⃣ Guardar perfil local
    const profile: Profile = {
      id: docRef.id,
      ...rest,
      fotoPerfil: fotoUrl,
      puntos: 0,
      evidencias: []
    };
    await this.session.setProfile(profile);

    // 4️⃣ Feedback
    // await loading.dismiss();
    // const ok = await this.toastCtrl.create({
    //   message: '¡Registro guardado con éxito!',
    //   duration: 1800,
    //   icon: 'checkmark-circle',
    // });
    // await ok.present();

    this.goToIntro2();

  } catch (err: any) {
    console.error('ERROR REGISTRO:', err);
    // await loading.dismiss();
    const t = await this.toastCtrl.create({
      message: 'Error al guardar: ' + (err?.message || 'Intenta de nuevo.'),
      duration: 3000,
      color: 'danger',
      icon: 'alert-circle',
    });
    await t.present();
  }
}

  

  goToIntro2() {
    this.router.navigate(['/intro2']);
  }

  ngOnInit() {}
}
