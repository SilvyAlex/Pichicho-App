import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { guardarRegistro } from '../services/registro.service';
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

  constructor(private fb: FormBuilder, private router: Router) {
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

  // Envío
  async onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const payload = this.form.value;

  try {
    await guardarRegistro(payload);
    alert('¡Registro guardado en Firebase! 🎉');
    this.router.navigate(['/intro2']);
  } catch (error) {
    console.error('Error al guardar:', error);
    alert('Ocurrió un error al guardar el registro.');
  }
}

  goToIntro2() {
    this.router.navigate(['/intro2']);
  }

  ngOnInit() {}
}
