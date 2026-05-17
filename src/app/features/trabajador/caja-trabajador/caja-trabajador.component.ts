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
import { CajaService } from '../../../core/services/caja.service';
import { RecaudoService } from '../../../core/services/recaudo.service';
import {
  CajaDiaria,
  ETIQUETA_MOVIMIENTO,
  MovimientoCaja,
} from '../../../core/models/caja.model';

/** Resumen de caja diaria del trabajador (HU-FE-011). */
@Component({
  selector: 'app-caja-trabajador',
  standalone: true,
  imports: [ReactiveFormsModule, DialogModule],
  templateUrl: './caja-trabajador.component.html',
  styleUrl: './caja-trabajador.component.scss',
})
export class CajaTrabajadorComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly recaudoService = inject(RecaudoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly caja = signal<CajaDiaria | null>(null);
  readonly loading = signal(false);
  /** true cuando el trabajador aún no abrió caja para hoy. */
  readonly sinCaja = signal(false);
  readonly errorMsg = signal<string | null>(null);

  /** Datos de la ruta del día: necesarios para abrir caja. */
  private readonly trabajadorId = signal<number | null>(null);
  private readonly rutaId = signal<number | null>(null);
  readonly rutaNombre = signal<string | null>(null);

  readonly fechaHoy = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /** ===== Diálogo abrir caja ===== */
  readonly dialogAbrirVisible = signal(false);
  readonly guardandoAbrir = signal(false);
  readonly formAbrir: FormGroup = this.fb.group({
    valorInicial: [0, [Validators.required, Validators.min(0)]],
    observacion: [''],
  });

  /** ===== Diálogo cerrar caja ===== */
  readonly dialogCerrarVisible = signal(false);
  readonly guardandoCerrar = signal(false);
  readonly formCerrar: FormGroup = this.fb.group({
    valorEntregado: [0, [Validators.required, Validators.min(0)]],
    observacion: [''],
  });

  /** Diferencia en vivo del diálogo de cierre (entregado - esperado). */
  readonly diferenciaCierre = computed(() => {
    const c = this.caja();
    if (!c) {
      return 0;
    }
    const entregado = Number(this.formCerrarValor());
    return entregado - c.valorEsperadoCierre;
  });

  /** Señal del valor entregado del formulario, para el computed de diferencia. */
  private readonly formCerrarValor = signal(0);

  readonly cajaAbierta = computed(() => this.caja()?.estado === 'ABIERTA');

  ngOnInit(): void {
    this.formCerrar.get('valorEntregado')?.valueChanges.subscribe((v) =>
      this.formCerrarValor.set(Number(v) || 0),
    );
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.sinCaja.set(false);
    this.cajaService.miCaja().subscribe({
      next: (data) => {
        this.caja.set(data);
        this.trabajadorId.set(data.trabajadorId);
        this.rutaId.set(data.rutaId);
        this.rutaNombre.set(data.rutaNombre);
        this.loading.set(false);
      },
      error: (err) => {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          // No hay caja abierta hoy: se ofrece abrirla.
          this.caja.set(null);
          this.sinCaja.set(true);
          this.cargarDatosRuta();
        } else {
          this.loading.set(false);
          this.errorMsg.set(this.mensaje(err, 'No se pudo cargar tu caja'));
        }
      },
    });
  }

  /** Obtiene trabajador y ruta desde la planilla del día para poder abrir caja. */
  private cargarDatosRuta(): void {
    this.recaudoService.miRuta().subscribe({
      next: (r) => {
        this.trabajadorId.set(r.trabajadorId);
        this.rutaId.set(r.rutaId);
        this.rutaNombre.set(r.rutaNombre);
        this.loading.set(false);
      },
      error: () => {
        // Sin planilla del día: igual se muestra el estado "sin caja".
        this.loading.set(false);
      },
    });
  }

  /** ===== Abrir caja ===== */
  abrirDialogoAbrir(): void {
    this.formAbrir.reset({ valorInicial: 0, observacion: '' });
    this.dialogAbrirVisible.set(true);
  }

  confirmarAbrir(): void {
    const trabajadorId = this.trabajadorId();
    if (!trabajadorId) {
      this.toast.add({
        severity: 'warn',
        summary: 'Sin ruta',
        detail: 'No se pudo identificar tu ruta para abrir la caja.',
      });
      return;
    }
    if (this.formAbrir.invalid) {
      this.formAbrir.markAllAsTouched();
      return;
    }
    this.guardandoAbrir.set(true);
    this.cajaService
      .abrir({
        trabajadorId,
        rutaId: this.rutaId(),
        valorInicial: Number(this.formAbrir.value.valorInicial),
        observacion: this.formAbrir.value.observacion || null,
      })
      .subscribe({
        next: (data) => {
          this.guardandoAbrir.set(false);
          this.dialogAbrirVisible.set(false);
          this.sinCaja.set(false);
          this.caja.set(data);
          this.toast.add({
            severity: 'success',
            summary: 'Caja abierta',
            detail: 'Tu caja del día quedó abierta.',
          });
        },
        error: (err) => {
          this.guardandoAbrir.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Error',
            detail: this.mensaje(err, 'No se pudo abrir la caja'),
          });
        },
      });
  }

  /** ===== Cerrar caja ===== */
  abrirDialogoCerrar(): void {
    const c = this.caja();
    if (!c) {
      return;
    }
    this.formCerrar.reset({
      valorEntregado: c.valorEsperadoCierre,
      observacion: '',
    });
    this.formCerrarValor.set(c.valorEsperadoCierre);
    this.dialogCerrarVisible.set(true);
  }

  confirmarCerrar(): void {
    const c = this.caja();
    if (!c || this.formCerrar.invalid) {
      this.formCerrar.markAllAsTouched();
      return;
    }
    this.guardandoCerrar.set(true);
    this.cajaService
      .cerrar({
        cajaId: c.id,
        valorEntregado: Number(this.formCerrar.value.valorEntregado),
        observacion: this.formCerrar.value.observacion || null,
      })
      .subscribe({
        next: (data) => {
          this.guardandoCerrar.set(false);
          this.dialogCerrarVisible.set(false);
          this.caja.set(data);
          this.toast.add({
            severity: 'success',
            summary: 'Caja cerrada',
            detail: 'El cierre de caja se registró correctamente.',
          });
        },
        error: (err) => {
          this.guardandoCerrar.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Error',
            detail: this.mensaje(err, 'No se pudo cerrar la caja'),
          });
        },
      });
  }

  /** ===== Navegación ===== */
  irARuta(): void {
    this.router.navigateByUrl('/trabajador/ruta');
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

  etiquetaMovimiento(tipo: string): string {
    return ETIQUETA_MOVIMIENTO[tipo] ?? tipo.replace(/_/g, ' ');
  }

  /** true si el movimiento resta dinero de la caja (préstamos / cierre). */
  esEgreso(m: MovimientoCaja): boolean {
    return (
      m.tipoMovimiento === 'PRESTAMO_ENTREGADO' ||
      m.tipoMovimiento === 'CIERRE_CAJA' ||
      m.tipoMovimiento === 'ANULACION_PAGO'
    );
  }

  iconoMovimiento(tipo: string): string {
    switch (tipo) {
      case 'CAJA_INICIAL':
        return 'pi pi-wallet';
      case 'PRESTAMO_ENTREGADO':
        return 'pi pi-arrow-up-right';
      case 'PAGO_RECIBIDO':
        return 'pi pi-arrow-down-left';
      case 'CIERRE_CAJA':
        return 'pi pi-lock';
      default:
        return 'pi pi-sync';
    }
  }

  estadoTexto(estado: string | undefined): string {
    return (estado ?? '').replace(/_/g, ' ');
  }

  horaMovimiento(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private mensaje(err: unknown, fallback: string): string {
    return (err as { error?: { message?: string } })?.error?.message ?? fallback;
  }
}
