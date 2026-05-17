import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { LayoutService } from '../../../core/services/layout.service';
import { PagoService } from '../../../core/services/pago.service';
import { RutaService } from '../../../core/services/ruta.service';
import { TrabajadorService } from '../../../core/services/trabajador.service';
import { PagoDetalle, PagoRow } from '../../../core/models/pago.model';
import { RutaComboDto } from '../../../core/models/ruta.model';
import {
  PageableRequest,
  TrabajadorComboDto,
} from '../../../core/models/trabajador.model';

/**
 * HU-FE-019 — Consulta de pagos.
 * Listado de pagos registrados con filtros por fecha, trabajador y ruta,
 * y diálogo de detalle del pago. El estado del pago (APLICADO / ANULADO /
 * REVERSADO) se muestra tal como lo entrega el backend; la anulación como
 * funcionalidad aún no existe en el sistema.
 */
@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [FormsModule, DialogModule],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.scss',
})
export class PagosComponent implements OnInit {
  private readonly service = inject(PagoService);
  private readonly rutaService = inject(RutaService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<PagoRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 10;

  search = '';
  filtroFecha = '';
  filtroTrabajador = '';
  filtroRuta = '';

  readonly rutas = signal<RutaComboDto[]>([]);
  readonly trabajadores = signal<TrabajadorComboDto[]>([]);

  /** ===== Detalle ===== */
  readonly dialogVisible = signal(false);
  readonly detalle = signal<PagoDetalle | null>(null);
  readonly detalleCargando = signal(false);

  ngOnInit(): void {
    this.layout.configurar(
      'Consulta de Pagos',
      'Verifica el recaudo diario y los pagos registrados',
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
      params['fecha'] = this.filtroFecha;
    }
    if (this.filtroTrabajador) {
      params['trabajadorId'] = this.filtroTrabajador;
    }
    if (this.filtroRuta) {
      params['rutaId'] = this.filtroRuta;
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
        this.error(err, 'No se pudo cargar el listado de pagos');
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
    this.buscar();
  }

  irPagina(destino: number): void {
    if (destino < 0 || destino >= this.totalPages()) {
      return;
    }
    this.page.set(destino);
    this.cargar();
  }

  /** ===== Detalle ===== */
  verDetalle(row: PagoRow): void {
    this.dialogVisible.set(true);
    this.detalleCargando.set(true);
    this.detalle.set(null);
    this.service.obtener(row.id).subscribe({
      next: (d) => {
        this.detalle.set(d);
        this.detalleCargando.set(false);
      },
      error: (err) => {
        this.detalleCargando.set(false);
        this.error(err, 'No se pudo cargar el detalle del pago');
      },
    });
  }

  /** ===== Helpers ===== */
  moneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor ?? 0);
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Marca un pago que no haya quedado aplicado (anulado/reversado). */
  esAnulado(estado: string | null | undefined): boolean {
    const e = (estado ?? '').toUpperCase();
    return e === 'ANULADO' || e === 'REVERSADO';
  }

  badgeEstado(estado: string | null | undefined): string {
    return 'badge--' + (estado ?? 'aplicado').toLowerCase();
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
