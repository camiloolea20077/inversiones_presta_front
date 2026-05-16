import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { LayoutService } from '../../../core/services/layout.service';
import { PrestamoService } from '../../../core/services/prestamo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { RutaService } from '../../../core/services/ruta.service';
import { TrabajadorService } from '../../../core/services/trabajador.service';
import {
  Prestamo,
  PrestamoRequest,
  PrestamoRow,
  Simulacion,
} from '../../../core/models/prestamo.model';
import { ClienteComboDto } from '../../../core/models/cliente.model';
import { RutaComboDto } from '../../../core/models/ruta.model';
import {
  PageableRequest,
  TrabajadorComboDto,
} from '../../../core/models/trabajador.model';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DialogModule],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.scss',
})
export class PrestamosComponent implements OnInit {
  private readonly service = inject(PrestamoService);
  private readonly clienteService = inject(ClienteService);
  private readonly rutaService = inject(RutaService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<PrestamoRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 8;

  search = '';
  filtroEstado = '';
  filtroRuta = '';

  readonly tiposInteres = ['FIJO_PRESTAMO', 'MENSUAL', 'DIARIO'];

  readonly clientes = signal<ClienteComboDto[]>([]);
  readonly rutas = signal<RutaComboDto[]>([]);
  readonly trabajadores = signal<TrabajadorComboDto[]>([]);

  /** ===== Selección / detalle ===== */
  readonly seleccionado = signal<PrestamoRow | null>(null);
  readonly detalle = signal<Prestamo | null>(null);
  readonly detalleCargando = signal(false);

  /** ===== Diálogo crear ===== */
  readonly dialogVisible = signal(false);
  readonly guardando = signal(false);
  readonly simulacion = signal<Simulacion | null>(null);

  readonly formPrestamo: FormGroup = this.fb.group({
    clienteId: [null as number | null, Validators.required],
    rutaId: [null as number | null, Validators.required],
    trabajadorId: [null as number | null, Validators.required],
    montoPrestado: [null as number | null, [Validators.required, Validators.min(1)]],
    tasaPorcentaje: [null as number | null, [Validators.required, Validators.min(0)]],
    tipoInteres: ['FIJO_PRESTAMO', Validators.required],
    plazoDias: [null as number | null, [Validators.required, Validators.min(1)]],
    observacion: [''],
  });

  ngOnInit(): void {
    this.layout.configurar(
      'Gestión de Préstamos',
      'Consulta la cartera y registra nuevos préstamos',
      { label: 'Nuevo préstamo', icon: 'pi pi-plus', run: () => this.nuevo() },
    );
    this.cargar();
    this.rutaService.listarActivas().subscribe({
      next: (data) => this.rutas.set(data),
      error: () => {},
    });
    this.formPrestamo.valueChanges.subscribe(() => this.recalcularSimulacion());
  }

  /** ===== Listado ===== */
  cargar(): void {
    this.loading.set(true);
    const params: Record<string, unknown> = {};
    if (this.filtroEstado) {
      params['estado'] = this.filtroEstado;
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
        const content = data.content ?? [];
        this.rows.set(content);
        this.totalPages.set(data.totalPages ?? 0);
        this.totalElements.set(data.totalElements ?? 0);
        this.loading.set(false);
        this.sincronizarSeleccion(content);
      },
      error: (err) => {
        this.loading.set(false);
        this.error(err, 'No se pudo cargar el listado de préstamos');
      },
    });
  }

  buscar(): void {
    this.page.set(0);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.filtroEstado = '';
    this.filtroRuta = '';
    this.buscar();
  }

  aplicarFiltro(): void {
    this.buscar();
  }

  irPagina(destino: number): void {
    if (destino < 0 || destino >= this.totalPages()) {
      return;
    }
    this.page.set(destino);
    this.cargar();
  }

  /** ===== Selección / detalle ===== */
  seleccionar(row: PrestamoRow): void {
    this.seleccionado.set(row);
    this.detalleCargando.set(true);
    this.detalle.set(null);
    this.service.obtener(row.id).subscribe({
      next: (p) => {
        this.detalle.set(p);
        this.detalleCargando.set(false);
      },
      error: () => this.detalleCargando.set(false),
    });
  }

  private sincronizarSeleccion(content: PrestamoRow[]): void {
    if (content.length === 0) {
      this.seleccionado.set(null);
      this.detalle.set(null);
      return;
    }
    const actual = this.seleccionado();
    const refrescado = actual
      ? content.find((p) => p.id === actual.id)
      : undefined;
    this.seleccionar(refrescado ?? content[0]);
  }

  /** ===== Crear préstamo ===== */
  nuevo(): void {
    this.formPrestamo.reset({
      clienteId: null,
      rutaId: null,
      trabajadorId: null,
      montoPrestado: null,
      tasaPorcentaje: null,
      tipoInteres: 'FIJO_PRESTAMO',
      plazoDias: null,
      observacion: '',
    });
    this.simulacion.set(null);
    this.dialogVisible.set(true);
    if (this.clientes().length === 0) {
      this.clienteService.listarActivos().subscribe({
        next: (data) => this.clientes.set(data),
        error: () => {},
      });
    }
    if (this.trabajadores().length === 0) {
      this.trabajadorService.listarActivos().subscribe({
        next: (data) => this.trabajadores.set(data),
        error: () => {},
      });
    }
  }

  private recalcularSimulacion(): void {
    const v = this.formPrestamo.value;
    const monto = Number(v.montoPrestado) || 0;
    const tasa = Number(v.tasaPorcentaje) || 0;
    const plazo = Number(v.plazoDias) || 0;
    if (monto <= 0 || plazo <= 0) {
      this.simulacion.set(null);
      return;
    }
    let interes: number;
    if (v.tipoInteres === 'DIARIO') {
      interes = (monto * tasa * plazo) / 100;
    } else if (v.tipoInteres === 'MENSUAL') {
      interes = (monto * tasa * plazo) / 100 / 30;
    } else {
      interes = (monto * tasa) / 100;
    }
    const total = monto + interes;
    this.simulacion.set({
      montoPrestado: monto,
      valorInteres: Math.round(interes * 100) / 100,
      totalPagar: Math.round(total * 100) / 100,
      cuotaDiaria: Math.round((total / plazo) * 100) / 100,
      plazoDias: plazo,
    });
  }

  guardar(): void {
    if (this.formPrestamo.invalid) {
      this.formPrestamo.markAllAsTouched();
      return;
    }
    const dto = this.formPrestamo.value as PrestamoRequest;
    this.guardando.set(true);
    this.service.crear(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Préstamo creado y cuotas generadas',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error(err, 'No se pudo crear el préstamo');
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

  campoInvalido(campo: string): boolean {
    const control = this.formPrestamo.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
