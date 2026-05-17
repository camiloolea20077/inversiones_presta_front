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
import { PrestamoService } from '../../../core/services/prestamo.service';
import { RecaudoDetalle, RecaudoDiario } from '../../../core/models/recaudo.model';
import { FORMAS_PAGO, RegistrarPagoRequest } from '../../../core/models/pago.model';
import {
  ClienteConPrestamoRequest,
  Simulacion,
} from '../../../core/models/prestamo.model';

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
  private readonly prestamoService = inject(PrestamoService);
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

  readonly tiposInteres = ['FIJO_PRESTAMO', 'MENSUAL', 'DIARIO'];

  /** ===== Diálogo agregar cliente cerca (HU-FE-009) ===== */
  readonly dialogClienteVisible = signal(false);
  /** Cliente base tras el cual se agregará el nuevo. null = al final de la ruta. */
  readonly clienteBase = signal<RecaudoDetalle | null>(null);
  /** Paso del asistente: 1 = datos del cliente, 2 = datos del préstamo. */
  readonly pasoCliente = signal<1 | 2>(1);
  readonly guardandoCliente = signal(false);
  readonly simulacion = signal<Simulacion | null>(null);
  readonly simulando = signal(false);

  /** Orden que tendrá el nuevo cliente: el del cliente base + 1. */
  readonly nuevoOrden = computed(() => {
    const base = this.clienteBase();
    if (base) {
      return base.orden + 1;
    }
    return (this.recaudo()?.totalClientes ?? 0) + 1;
  });

  readonly formCliente: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    documento: ['', Validators.maxLength(30)],
    telefono: ['', Validators.maxLength(30)],
    direccion: ['', Validators.maxLength(255)],
    barrio: ['', Validators.maxLength(150)],
    observacionCliente: [''],
  });

  readonly formPrestamo: FormGroup = this.fb.group({
    montoPrestado: [0, [Validators.required, Validators.min(1)]],
    tasaPorcentaje: [0, [Validators.required, Validators.min(0)]],
    tipoInteres: ['FIJO_PRESTAMO', Validators.required],
    plazoDias: [30, [Validators.required, Validators.min(1)]],
    observacionPrestamo: [''],
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
    // Recalcula la simulación al cambiar los datos del préstamo (HU-FE-010).
    this.formPrestamo.valueChanges.subscribe(() => {
      if (this.pasoCliente() === 2 && this.formPrestamo.valid) {
        this.simular();
      } else {
        this.simulacion.set(null);
      }
    });
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

  /** ===== Agregar cliente cerca (HU-FE-009) ===== */

  /**
   * Abre el asistente para agregar un cliente nuevo.
   * @param base cliente tras el cual se insertará; null = al final de la ruta.
   */
  abrirAgregarCliente(base: RecaudoDetalle | null): void {
    this.clienteBase.set(base);
    this.pasoCliente.set(1);
    this.simulacion.set(null);
    this.formCliente.reset({
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      barrio: '',
      observacionCliente: '',
    });
    this.formPrestamo.reset({
      montoPrestado: 0,
      tasaPorcentaje: 0,
      tipoInteres: 'FIJO_PRESTAMO',
      plazoDias: 30,
      observacionPrestamo: '',
    });
    this.dialogClienteVisible.set(true);
  }

  /** Avanza del paso de datos del cliente al paso del préstamo. */
  continuarAPrestamo(): void {
    if (this.formCliente.invalid) {
      this.formCliente.markAllAsTouched();
      return;
    }
    this.pasoCliente.set(2);
    // Muestra una simulación inicial con los valores actuales del préstamo.
    if (this.formPrestamo.valid) {
      this.simular();
    }
  }

  volverACliente(): void {
    this.pasoCliente.set(1);
  }

  /** Simula el préstamo con los valores actuales del formulario. */
  simular(): void {
    if (this.formPrestamo.invalid) {
      this.formPrestamo.markAllAsTouched();
      return;
    }
    const v = this.formPrestamo.value;
    this.simulando.set(true);
    this.prestamoService
      .simular({
        montoPrestado: Number(v.montoPrestado),
        tasaPorcentaje: Number(v.tasaPorcentaje),
        tipoInteres: v.tipoInteres,
        plazoDias: Number(v.plazoDias),
      })
      .subscribe({
        next: (sim) => {
          this.simulacion.set(sim);
          this.simulando.set(false);
        },
        error: (err) => {
          this.simulando.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Error',
            detail: this.mensaje(err, 'No se pudo simular el préstamo'),
          });
        },
      });
  }

  /** Crea el cliente y su préstamo en una sola operación transaccional. */
  guardarClienteConPrestamo(): void {
    const recaudo = this.recaudo();
    if (!recaudo) {
      return;
    }
    if (this.formCliente.invalid || this.formPrestamo.invalid) {
      this.formCliente.markAllAsTouched();
      this.formPrestamo.markAllAsTouched();
      return;
    }

    const c = this.formCliente.value;
    const p = this.formPrestamo.value;
    const dto: ClienteConPrestamoRequest = {
      nombre: c.nombre.trim(),
      documento: c.documento || null,
      telefono: c.telefono || null,
      direccion: c.direccion || null,
      barrio: c.barrio || null,
      observacionCliente: c.observacionCliente || null,
      rutaId: recaudo.rutaId,
      ordenBase: this.clienteBase()?.orden ?? null,
      trabajadorId: recaudo.trabajadorId,
      montoPrestado: Number(p.montoPrestado),
      tasaPorcentaje: Number(p.tasaPorcentaje),
      tipoInteres: p.tipoInteres,
      plazoDias: Number(p.plazoDias),
      observacionPrestamo: p.observacionPrestamo || null,
    };

    this.guardandoCliente.set(true);
    this.prestamoService.crearClienteConPrestamo(dto).subscribe({
      next: (res) => {
        this.guardandoCliente.set(false);
        this.dialogClienteVisible.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Cliente agregado',
          detail: `${res.clienteNombre} quedó en la posición ${res.ordenAsignado} de la ruta.`,
        });
        // Recarga la ruta: el nuevo cliente aparece tras el base y los demás
        // se desplazan una posición.
        this.cargar();
      },
      error: (err) => {
        this.guardandoCliente.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'No se pudo agregar',
          detail: this.mensaje(err, 'No se pudo crear el cliente y el préstamo'),
        });
      },
    });
  }

  irACaja(): void {
    this.router.navigateByUrl('/trabajador/caja');
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
