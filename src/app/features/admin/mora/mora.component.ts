import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { LayoutService } from '../../../core/services/layout.service';
import { MoraService } from '../../../core/services/mora.service';
import { RutaService } from '../../../core/services/ruta.service';
import { TrabajadorService } from '../../../core/services/trabajador.service';
import { MoraRow } from '../../../core/models/mora.model';
import { RutaComboDto } from '../../../core/models/ruta.model';
import {
  PageableRequest,
  TrabajadorComboDto,
} from '../../../core/models/trabajador.model';

/**
 * HU-FE-021 — Reporte de clientes en mora.
 * Lista los clientes con préstamo activo y cuotas vencidas, mostrando ruta,
 * trabajador, días de mora y saldo pendiente. Permite filtrar por ruta, por
 * trabajador y por rango de días de mora. Reúsa el patrón del listado de
 * pagos (HU-FE-019): backend `POST /api/mora/listar` con `PageableDto`.
 */
@Component({
  selector: 'app-mora',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mora.component.html',
  styleUrl: './mora.component.scss',
})
export class MoraComponent implements OnInit {
  private readonly service = inject(MoraService);
  private readonly rutaService = inject(RutaService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<MoraRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 10;

  search = '';
  filtroRuta = '';
  filtroTrabajador = '';
  filtroDiasDesde = '';
  filtroDiasHasta = '';

  readonly rutas = signal<RutaComboDto[]>([]);
  readonly trabajadores = signal<TrabajadorComboDto[]>([]);

  /** Saldo vencido total acumulado de la página actual. */
  readonly saldoVencidoPagina = computed(() =>
    this.rows().reduce((acc, r) => acc + (r.saldo_vencido ?? 0), 0),
  );

  ngOnInit(): void {
    this.layout.configurar(
      'Clientes en Mora',
      'Seguimiento a la cartera vencida',
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
    if (!this.rangoDiasValido()) {
      this.toast.add({
        severity: 'warn',
        summary: 'Rango inválido',
        detail: 'El día "desde" no puede ser mayor que el día "hasta".',
      });
      return;
    }
    this.loading.set(true);
    const params: Record<string, unknown> = {};
    if (this.filtroRuta) {
      params['rutaId'] = this.filtroRuta;
    }
    if (this.filtroTrabajador) {
      params['trabajadorId'] = this.filtroTrabajador;
    }
    if (this.filtroDiasDesde !== '') {
      params['diasMoraDesde'] = this.filtroDiasDesde;
    }
    if (this.filtroDiasHasta !== '') {
      params['diasMoraHasta'] = this.filtroDiasHasta;
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
        this.error(err, 'No se pudo cargar el reporte de mora');
      },
    });
  }

  rangoDiasValido(): boolean {
    if (this.filtroDiasDesde === '' || this.filtroDiasHasta === '') {
      return true;
    }
    return Number(this.filtroDiasDesde) <= Number(this.filtroDiasHasta);
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
    this.filtroRuta = '';
    this.filtroTrabajador = '';
    this.filtroDiasDesde = '';
    this.filtroDiasHasta = '';
    this.buscar();
  }

  irPagina(destino: number): void {
    if (destino < 0 || destino >= this.totalPages()) {
      return;
    }
    this.page.set(destino);
    this.cargar();
  }

  /** ===== Helpers ===== */
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
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
      return valor;
    }
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  iniciales(nombre: string | null | undefined): string {
    if (!nombre) {
      return '?';
    }
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  /** Severidad del badge de mora según los días de atraso. */
  nivelMora(dias: number | null | undefined): string {
    const d = dias ?? 0;
    if (d >= 30) {
      return 'mora--alta';
    }
    if (d >= 8) {
      return 'mora--media';
    }
    return 'mora--baja';
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
