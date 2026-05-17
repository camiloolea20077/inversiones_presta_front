import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { LayoutService } from '../../../core/services/layout.service';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import {
  AuditoriaRow,
  AuditoriaUsuario,
} from '../../../core/models/auditoria.model';
import { PageableRequest } from '../../../core/models/trabajador.model';

/**
 * HU-FE-022 — Auditoría del sistema.
 * Lista los eventos de auditoría (creación de clientes/préstamos, pagos,
 * cambios de orden en ruta, cierres de caja) con fecha, usuario, acción,
 * tabla y registro afectado. Permite filtrar por usuario, acción y fecha,
 * y abre un diálogo con el valor anterior / valor nuevo del registro.
 * Reúsa el patrón del listado de pagos (HU-FE-019): backend
 * `POST /api/auditoria/listar` con `PageableDto`.
 */
@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule, DialogModule],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent implements OnInit {
  private readonly service = inject(AuditoriaService);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** Acciones registradas hoy por el sistema (HU-BE-020). */
  readonly acciones = [
    'CREAR',
    'PAGAR',
    'REORDENAR',
    'INSERTAR_EN_RUTA',
    'CERRAR_CAJA',
    'ANULAR',
  ];

  /** ===== Listado ===== */
  readonly rows = signal<AuditoriaRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 10;

  search = '';
  filtroUsuario = '';
  filtroAccion = '';
  filtroFecha = '';

  readonly usuarios = signal<AuditoriaUsuario[]>([]);

  /** ===== Detalle ===== */
  readonly dialogVisible = signal(false);
  readonly detalle = signal<AuditoriaRow | null>(null);

  ngOnInit(): void {
    this.layout.configurar(
      'Auditoría del Sistema',
      'Trazabilidad de las acciones sensibles realizadas en el sistema',
    );
    this.cargar();
    this.service.usuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => {},
    });
  }

  /** ===== Listado ===== */
  cargar(): void {
    this.loading.set(true);
    const params: Record<string, unknown> = {};
    if (this.filtroUsuario) {
      params['usuarioId'] = this.filtroUsuario;
    }
    if (this.filtroAccion) {
      params['accion'] = this.filtroAccion;
    }
    if (this.filtroFecha) {
      params['fecha'] = this.filtroFecha;
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
        this.error(err, 'No se pudo cargar el registro de auditoría');
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
    this.filtroUsuario = '';
    this.filtroAccion = '';
    this.filtroFecha = '';
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
  verDetalle(row: AuditoriaRow): void {
    this.detalle.set(row);
    this.dialogVisible.set(true);
  }

  /** Indica si el evento trae al menos un valor anterior/nuevo para mostrar. */
  tieneValores(row: AuditoriaRow | null): boolean {
    return !!row && (!!row.valor_anterior || !!row.valor_nuevo);
  }

  /** ===== Helpers ===== */
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

  /** Etiqueta legible de la acción. */
  accionLabel(accion: string | null | undefined): string {
    const a = (accion ?? '').toUpperCase();
    const mapa: Record<string, string> = {
      CREAR: 'Creación',
      PAGAR: 'Pago',
      REORDENAR: 'Reordenamiento',
      INSERTAR_EN_RUTA: 'Inserción en ruta',
      CERRAR_CAJA: 'Cierre de caja',
      ANULAR: 'Anulación',
    };
    return mapa[a] ?? (accion ?? '—');
  }

  /** Clase del badge según el tipo de acción. */
  accionBadge(accion: string | null | undefined): string {
    return 'accion--' + (accion ?? 'otro').toLowerCase();
  }

  /** Formatea un valor JSON (texto) de forma legible; si no es JSON lo deja igual. */
  formatearJson(valor: string | null | undefined): string {
    if (!valor) {
      return '—';
    }
    try {
      return JSON.stringify(JSON.parse(valor), null, 2);
    } catch {
      return valor;
    }
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
