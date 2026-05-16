import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Rol } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly cargando = signal(false);
  readonly verPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    rol: ['ADMINISTRADOR' as Rol, Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    recordarme: [false],
  });

  seleccionarRol(rol: Rol): void {
    this.form.controls.rol.setValue(rol);
  }

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { rol, correo, password } = this.form.getRawValue();
    this.cargando.set(true);

    this.auth.login({ rol, correo, password }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl(this.auth.rutaInicio());
      },
      error: (err) => {
        this.cargando.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'No se pudo iniciar sesión',
          detail: err?.error?.message ?? 'Verifica tus credenciales e intenta de nuevo.',
        });
      },
    });
  }

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }
}
