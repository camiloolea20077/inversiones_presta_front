import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { LayoutService } from '../../../core/services/layout.service';
import { CajaService } from '../../../core/services/caja.service';
import { RutaService } from '../../../core/services/ruta.service';
import { TrabajadorService } from '../../../core/services/trabajador.service';
import { CajaDiaria, CajaRow } from '../../../core/models/caja.model';
import { RutaComboDto } from '../../../core/models/ruta.model';
import {
  PageableRequest,
  TrabajadorComboDto,
} from '../../../core/models/trabajador.model';

/**
 * HU-FE-020 — Cierre de caja administrativo.
 * Listado de las cajas diarias de los trabajadores con filtros por fecha,
 * trabajador, ruta y estado. Al seleccionar una caja abierta, abre un diálogo
 * de cierre que muestra caja inicial, préstamos entregados, recaudo recibido y
 * valor esperado de cierre; permite ingresar el valor entregado, calcula la
 * diferencia en vivo y exige observación cuando la diferencia no es cero.
 * Una caja ya cerrada se abre en modo de solo lectura.
 */
@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [FormsModule, DialogModule],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent implements OnInit {
  private readonly service = inject(CajaService);
  private readonly rutaService = inject(RutaService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<CajaRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 10;

  search = '';
  filtroFecha = '';
  filtroTrabajador = '';
  filtroRuta = '';
  filtroEstado = '';

  readonly rutas = signal<RutaComboDto[]>([]);
  readonly trabajadores = signal<TrabajadorComboDto[]>([]);

  /** ===== Diálogo de cierre ===== */
  readonly dialogVisible = signal(false);
  readonly caja = signal<CajaDiaria | null>(null);
  readonly cajaCargando = signal(false);
  readonly cerrando = signal(false);

  /** Valor entregado capturado por el administrador. */
  valorEntregado: number | null = null;
  observacion = '';

  /** Caja inicial - préstamos + recaudo (en vivo, por si el backend cambió). */
  readonly esperado = computed(() => {
    const c = this.caja();
    return c ? c.valorEsperadoCierre : 0;
  });

  /** Diferencia calculada en vivo: valor entregado - valor esperado. */
  readonly diferencia = computed(() => {
    const entregado = this.valorEntregado ?? 0;
    return entregado - this.esperado();
  });

  /** Hay diferencia cuando el valor entregado no coincide con el esperado. */
  readonly hayDiferencia = computed(() => Math.round(this.diferencia()) !== 0);

  ngOnInit(): void {
    this.layout.configurar(
      'Cierre de Caja',
      'Revisa y cierra la caja diaria de cada trabajador',
    );
    this.cargar();
    this.rutaService.listarActivas().subscribe({
      next: (data) => this.rutas.set(data),
      error: () => {},
    });
    this.trabajadorService.listarActivos().subscribe({
      next: (data) => this.trabajadores.set(data),
      error: () => {},
    });
  }

  /** ===== Listado ===== */
  cargar(): void {
    this.loading.set(true);
    const params: Record<string, unknown> = {};
    if (this.filtroFecha) {
      params['fechaCaja'] = this.filtroFecha;
    }
    if (this.filtroTrabajador) {
      params['trabajadorId'] = this.filtroTrabajador;
    }
    if (this.filtroRuta) {
      params['rutaId'] = this.filtroRuta;
    }
    if (this.filtroEstado) {
      params['estado'] = this.filtroEstado;
    }
    const request: PageableRequest = {
      page: this.page(),
      rows: this.tamano,
      search: this.search.trim() || undefined,
      params: Object.keys(params).length ? params : undefined,
    };
    this.service.listar(request).subscribe({
      next: (data) => {
        this.rows.set(data.content ?? []);
        this.totalPages.set(data.totalPages ?? 0);
        this.totalElements.set(data.totalElements ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error(err, 'No se pudo cargar el listado de cajas');
      },
    });
  }

  buscar(): void {
    this.page.set(0);
    this.cargar();
  }

  aplicarFiltro(): void {
    this.buscar();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.filtroFecha = '';
    this.filtroTrabajador = '';
    this.filtroRuta = '';
    this.filtroEstado = '';
    this.buscar();
  }

  irPagina(destino: number): void {
    if (destino < 0 || destino >= this.totalPages()) {
      return;
    }
    this.page.set(destino);
    this.cargar();
  }

  /** ===== Diálogo de cierre ===== */
  abrirCaja(row: CajaRow): void {
    this.dialogVisible.set(true);
    this.cajaCargando.set(true);
    this.caja.set(null);
    this.valorEntregado = null;
    this.observacion = '';
    this.service.obtener(row.id).subscribe({
      next: (c) => {
        this.caja.set(c);
        // Si ya está cerrada, mostrar los datos registrados (solo lectura).
        if (!this.esAbierta(c.estado)) {
          this.valorEntregado = c.valorEntregado;
          this.observacion = c.observacion ?? '';
        }
        this.cajaCargando.set(false);
      },
      error: (err) => {
        this.cajaCargando.set(false);
        this.error(err, 'No se pudo cargar la caja');
      },
    });
  }

  cerrarCaja(): void {
    const c = this.caja();
    if (!c || !this.esAbierta(c.estado)) {
      return;
    }
    if (this.valorEntregado == null || this.valorEntregado < 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'Valor requerido',
        detail: 'Ingresa el valor entregado por el trabajador.',
      });
      return;
    }
    if (this.hayDiferencia() && !this.observacion.trim()) {
      this.toast.add({
        severity: 'warn',
        summary: 'Observación requerida',
        detail: 'Hay una diferencia: debes registrar una observación.',
      });
      return;
    }
    this.cerrando.set(true);
    this.service
      .cerrar({
        cajaId: c.id,
        valorEntregado: this.valorEntregado,
        observacion: this.observacion.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.cerrando.set(false);
          this.dialogVisible.set(false);
          this.toast.add({
            severity: 'success',
            summary: 'Caja cerrada',
            detail:
              res.estado === 'CERRADA_CON_DIFERENCIA'
                ? `Caja cerrada con una diferencia de ${this.moneda(res.diferencia)}.`
                : 'Caja cerrada correctamente sin diferencias.',
          });
          this.cargar();
        },
        error: (err) => {
          this.cerrando.set(false);
          this.error(err, 'No se pudo cerrar la caja');
        },
      });
  }

  /** ===== Helpers ===== */
  esAbierta(estado: string | null | undefined): boolean {
    return (estado ?? '').toUpperCase() === 'ABIERTA';
  }

  moneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  fecha(valor: string | null | undefined): string {
    if (!valor) {
      return '—';
    }
    const d = new Date(valor + 'T00:00:00');
    if (Number.isNaN(d.getTime())) {
      return valor;
    }
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  estadoLabel(estado: string | null | undefined): string {
    const e = (estado ?? '').toUpperCase();
    if (e === 'ABIERTA') {
      return 'Abierta';
    }
    if (e === 'CERRADA') {
      return 'Cerrada';
    }
    if (e === 'CERRADA_CON_DIFERENCIA') {
      return 'Con diferencia';
    }
    if (e === 'ANULADA') {
      return 'Anulada';
    }
    return estado ?? '—';
  }

  badgeEstado(estado: string | null | undefined): string {
    return 'badge--' + (estado ?? '').toLowerCase();
  }

  /** Clase para una diferencia: cero, sobrante o faltante. */
  claseDiferencia(valor: number | null | undefined): string {
    const v = Math.round(valor ?? 0);
    if (v === 0) {
      return 'dif--ok';
    }
    return v > 0 ? 'dif--sobra' : 'dif--falta';
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
