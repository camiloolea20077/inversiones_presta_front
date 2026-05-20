import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { LayoutService } from '../../../core/services/layout.service';
import { PresupuestoService } from '../../../core/services/presupuesto.service';
import {
  ETIQUETA_MOVIMIENTO_PRESUPUESTO,
  MovimientoPresupuesto,
  Presupuesto,
} from '../../../core/models/presupuesto.model';

type DialogoModo = 'abrir' | 'capitalizar' | 'retirar';

/**
 * Gestión del presupuesto / capital del administrador. Muestra cuánto se
 * aportó, cuánto está prestado, cuánto está disponible para nuevos préstamos
 * y la historia de movimientos. Si todavía no hay presupuesto abierto, exige
 * registrar el monto inicial antes de operar.
 */
@Component({
  selector: 'app-presupuesto',
  standalone: true,
  imports: [FormsModule, DialogModule],
  templateUrl: './presupuesto.component.html',
  styleUrl: './presupuesto.component.scss',
})
export class PresupuestoComponent implements OnInit {
  private readonly service = inject(PresupuestoService);
  private readonly layout = inject(LayoutService);
  private readonly toast = inject(MessageService);

  readonly cargando = signal(true);
  readonly presupuesto = signal<Presupuesto | null>(null);

  readonly dialogVisible = signal(false);
  readonly modo = signal<DialogoModo>('abrir');
  readonly guardando = signal(false);

  monto: number | null = null;
  observacion = '';

  /** Información para los KPIs de resumen. */
  readonly kpis = computed(() => {
    const p = this.presupuesto();
    if (!p) {
      return [];
    }
    return [
      {
        label: 'Capital aportado',
        valor: this.moneda(p.capitalAportado),
        icon: 'pi pi-briefcase',
        tone: 'blue',
        hint: 'Aperturas + capitalizaciones − retiros',
      },
      {
        label: 'Saldo disponible',
        valor: this.moneda(p.saldoDisponible),
        icon: 'pi pi-wallet',
        tone: 'green',
        hint: 'Lo que la caja del administrador permite prestar hoy',
      },
      {
        label: 'Prestado histórico',
        valor: this.moneda(p.totalPrestado),
        icon: 'pi pi-arrow-up-right',
        tone: 'amber',
        hint: 'Capital total desembolsado',
      },
      {
        label: 'Capital en la calle',
        valor: this.moneda(p.capitalEnCalle),
        icon: 'pi pi-clock',
        tone: 'purple',
        hint: 'Capital aún no recuperado',
      },
      {
        label: 'Recaudado',
        valor: this.moneda(p.totalRecaudado),
        icon: 'pi pi-money-bill',
        tone: 'cyan',
        hint: 'Total recibido en pagos',
      },
    ];
  });

  ngOnInit(): void {
    this.layout.configurar(
      'Presupuesto del administrador',
      'Capital inicial, capitalizaciones y saldo disponible para nuevos préstamos',
    );
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.obtener().subscribe({
      next: (data) => {
        this.presupuesto.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error(err, 'No se pudo cargar el presupuesto');
      },
    });
  }

  abrirDialogo(modo: DialogoModo): void {
    this.modo.set(modo);
    this.monto = null;
    this.observacion = '';
    this.dialogVisible.set(true);
  }

  cerrarDialogo(): void {
    this.dialogVisible.set(false);
  }

  guardar(): void {
    if (this.monto == null || this.monto <= 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'Monto requerido',
        detail: 'Ingresa un valor mayor a cero.',
      });
      return;
    }
    this.guardando.set(true);
    const observacion = this.observacion.trim() || undefined;
    const accion =
      this.modo() === 'abrir'
        ? this.service.abrir({ montoInicial: this.monto, observacion })
        : this.modo() === 'capitalizar'
          ? this.service.capitalizar({ valor: this.monto, observacion })
          : this.service.retirar({ valor: this.monto, observacion });

    accion.subscribe({
      next: (p) => {
        this.presupuesto.set(p);
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: this.mensajeExito(),
        });
      },
      error: (err) => {
        this.guardando.set(false);
        this.error(err, 'No se pudo guardar la operación');
      },
    });
  }

  etiquetaMovimiento(tipo: string): string {
    return ETIQUETA_MOVIMIENTO_PRESUPUESTO[tipo] ?? tipo;
  }

  badgeMovimiento(tipo: string): string {
    if (tipo === 'APERTURA' || tipo === 'CAPITALIZACION') {
      return 'badge--ingreso';
    }
    if (tipo === 'RETIRO') {
      return 'badge--retiro';
    }
    return 'badge--ajuste';
  }

  signoMovimiento(m: MovimientoPresupuesto): string {
    return m.tipo === 'RETIRO' ? '−' : '+';
  }

  moneda(valor: number | null | undefined): string {
    return '$ ' + Math.round(valor ?? 0).toLocaleString('es-CO');
  }

  fechaHora(valor: string | null | undefined): string {
    if (!valor) {
      return '—';
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
      return valor;
    }
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  tituloDialogo(): string {
    if (this.modo() === 'abrir') {
      return 'Registrar presupuesto inicial';
    }
    if (this.modo() === 'capitalizar') {
      return 'Capitalizar el presupuesto';
    }
    return 'Retirar capital del presupuesto';
  }

  ayudaDialogo(): string {
    if (this.modo() === 'abrir') {
      return 'Este monto es el capital desde el cual partirá toda la operación de préstamos.';
    }
    if (this.modo() === 'capitalizar') {
      return 'El valor se suma al capital aportado y aumenta el saldo disponible.';
    }
    return 'El valor se descuenta del saldo disponible. No puede superar el saldo actual.';
  }

  private mensajeExito(): string {
    if (this.modo() === 'abrir') {
      return 'Presupuesto inicial registrado.';
    }
    if (this.modo() === 'capitalizar') {
      return 'Capitalización registrada.';
    }
    return 'Retiro registrado.';
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
