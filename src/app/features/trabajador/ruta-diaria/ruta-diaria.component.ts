import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { RecaudoService } from '../../../core/services/recaudo.service';
import { PagoService } from '../../../core/services/pago.service';
import { RecaudoDetalle, RecaudoDiario } from '../../../core/models/recaudo.model';
import { FORMAS_PAGO, RegistrarPagoRequest } from '../../../core/models/pago.model';

@Component({
  selector: 'app-ruta-diaria',
  standalone: true,
  imports: [ReactiveFormsModule, DialogModule],
  templateUrl: './ruta-diaria.component.html',
  styleUrl: './ruta-diaria.component.scss',
})
export class RutaDiariaComponent implements OnInit {
  private readonly recaudoService = inject(RecaudoService);
  private readonly pagoService = inject(PagoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly recaudo = signal<RecaudoDiario | null>(null);
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly usuario = this.auth.usuario;
  readonly formasPago = FORMAS_PAGO;

  /** ===== Diálogo de pago ===== */
  readonly dialogPagoVisible = signal(false);
  readonly detalleSeleccionado = signal<RecaudoDetalle | null>(null);
  readonly guardandoPago = signal(false);

  readonly formPago: FormGroup = this.fb.group({
    valorPago: [0, [Validators.required, Validators.min(1)]],
    formaPago: ['EFECTIVO', Validators.required],
    observacion: [''],
  });

  readonly fechaHoy = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly progreso = computed(() => {
    const r = this.recaudo();
    if (!r || r.totalClientes === 0) {
      return 0;
    }
    return Math.round((r.clientesPagados / r.totalClientes) * 100);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.recaudoService.miRuta().subscribe({
      next: (data) => {
        this.recaudo.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(this.mensaje(err, 'No se pudo cargar tu ruta del día'));
      },
    });
  }

  /** ===== Registrar pago ===== */
  abrirPago(detalle: RecaudoDetalle): void {
    if (!detalle.prestamoId) {
      this.toast.add({
        severity: 'warn',
        summary: 'Sin préstamo',
        detail: 'Este cliente no tiene un préstamo activo.',
      });
      return;
    }
    this.detalleSeleccionado.set(detalle);
    this.formPago.reset({
      valorPago: detalle.valorEsperado,
      formaPago: 'EFECTIVO',
      observacion: '',
    });
    this.dialogPagoVisible.set(true);
  }

  guardarPago(): void {
    const detalle = this.detalleSeleccionado();
    if (!detalle || this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      return;
    }
    const dto: RegistrarPagoRequest = {
      recaudoDetalleId: detalle.id,
      valorPago: Number(this.formPago.value.valorPago),
      formaPago: this.formPago.value.formaPago,
      observacion: this.formPago.value.observacion || null,
    };
    this.guardandoPago.set(true);
    this.pagoService.registrarPago(dto).subscribe({
      next: () => {
        this.guardandoPago.set(false);
        this.dialogPagoVisible.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Pago registrado',
          detail: 'El pago se registró correctamente.',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardandoPago.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: this.mensaje(err, 'No se pudo registrar el pago'),
        });
      },
    });
  }

  marcarNoPago(): void {
    const detalle = this.detalleSeleccionado();
    if (!detalle) {
      return;
    }
    this.guardandoPago.set(true);
    this.pagoService
      .marcarNoPago({
        recaudoDetalleId: detalle.id,
        observacion: this.formPago.value.observacion || null,
      })
      .subscribe({
        next: () => {
          this.guardandoPago.set(false);
          this.dialogPagoVisible.set(false);
          this.toast.add({
            severity: 'info',
            summary: 'Registrado',
            detail: 'Se marcó que el cliente no pagó hoy.',
          });
          this.cargar();
        },
        error: (err) => {
          this.guardandoPago.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Error',
            detail: this.mensaje(err, 'No se pudo marcar el cliente'),
          });
        },
      });
  }

  agregarCliente(): void {
    this.toast.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: 'La creación de clientes en ruta estará disponible pronto.',
    });
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  /** ===== Helpers ===== */
  moneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  ordenTexto(orden: number): string {
    return orden < 10 ? `0${orden}` : `${orden}`;
  }

  private mensaje(err: unknown, fallback: string): string {
    return (err as { error?: { message?: string } })?.error?.message ?? fallback;
  }
}
