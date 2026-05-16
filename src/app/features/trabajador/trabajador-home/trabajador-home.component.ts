import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-trabajador-home',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="min-h-screen bg-slate-100 p-5">
      <div class="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6">
        <span class="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Vista del trabajador
        </span>
        <h1 class="mt-1 text-xl font-bold text-slate-900">
          Hola, {{ auth.usuario()?.nombreCompleto }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          El login quedó configurado. La ruta diaria y el registro de pagos se
          construirán en las siguientes historias de usuario.
        </p>
        <div class="mt-6">
          <p-button label="Cerrar sesión" icon="pi pi-sign-out" severity="secondary"
            styleClass="w-full" (onClick)="salir()" />
        </div>
      </div>
    </div>
  `,
})
export class TrabajadorHomeComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
