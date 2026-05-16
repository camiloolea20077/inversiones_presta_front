import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { ClienteService } from '../../../core/services/cliente.service';
import { RutaService } from '../../../core/services/ruta.service';
import { ClienteRequest, ClienteRow } from '../../../core/models/cliente.model';
import { RutaComboDto } from '../../../core/models/ruta.model';
import { PageableRequest } from '../../../core/models/trabajador.model';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DialogModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  private readonly service = inject(ClienteService);
  private readonly rutaService = inject(RutaService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<ClienteRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 8;

  search = '';
  filtroEstado = '';
  filtroRuta = '';

  readonly rutas = signal<RutaComboDto[]>([]);
  readonly seleccionado = signal<ClienteRow | null>(null);

  readonly estados = ['ACTIVO', 'BLOQUEADO', 'RETIRADO'];

  /** ===== Diálogo ===== */
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);

  readonly tituloDialogo = computed(() =>
    this.editandoId() ? 'Editar cliente' : 'Nuevo cliente',
  );

  readonly formCliente: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    documento: ['', [Validators.maxLength(30)]],
    telefono: ['', [Validators.maxLength(30)]],
    direccion: ['', [Validators.maxLength(255)]],
    barrio: ['', [Validators.maxLength(150)]],
    observacion: [''],
    estado: ['ACTIVO'],
  });

  ngOnInit(): void {
    this.layout.configurar(
      'Gestión de Clientes',
      'Administra los clientes, su estado y su ruta de cobro',
      { label: 'Nuevo cliente', icon: 'pi pi-plus', run: () => this.nuevo() },
    );
    this.cargar();
    this.rutaService.listarActivas().subscribe({
      next: (data) => this.rutas.set(data),
      error: () => {},
    });
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
        this.error(err, 'No se pudo cargar el listado de clientes');
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

  seleccionar(row: ClienteRow): void {
    this.seleccionado.set(row);
  }

  private sincronizarSeleccion(content: ClienteRow[]): void {
    if (content.length === 0) {
      this.seleccionado.set(null);
      return;
    }
    const actual = this.seleccionado();
    const refrescado = actual
      ? content.find((c) => c.id === actual.id)
      : undefined;
    this.seleccionado.set(refrescado ?? content[0]);
  }

  /** ===== Crear / editar ===== */
  nuevo(): void {
    this.editandoId.set(null);
    this.formCliente.reset({
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      barrio: '',
      observacion: '',
      estado: 'ACTIVO',
    });
    this.dialogVisible.set(true);
  }

  editar(row: ClienteRow): void {
    this.editandoId.set(row.id);
    this.dialogVisible.set(true);
    this.service.obtener(row.id).subscribe({
      next: (c) => {
        this.formCliente.reset({
          nombre: c.nombre,
          documento: c.documento ?? '',
          telefono: c.telefono ?? '',
          direccion: c.direccion ?? '',
          barrio: c.barrio ?? '',
          observacion: c.observacion ?? '',
          estado: c.estado === 'EN_MORA' ? 'ACTIVO' : c.estado,
        });
      },
      error: (err) => this.error(err, 'No se pudo cargar el cliente'),
    });
  }

  guardar(): void {
    if (this.formCliente.invalid) {
      this.formCliente.markAllAsTouched();
      return;
    }
    const dto = this.formCliente.value as ClienteRequest;
    this.guardando.set(true);
    const id = this.editandoId();
    const peticion = id
      ? this.service.actualizar(id, dto)
      : this.service.crear(dto);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: id ? 'Cliente actualizado' : 'Cliente creado',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error(err, 'No se pudo guardar el cliente');
      },
    });
  }

  cambiarEstado(row: ClienteRow, estado: string): void {
    this.service.cambiarEstado(row.id, estado).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Estado del cliente actualizado',
        });
        this.cargar();
      },
      error: (err) => this.error(err, 'No se pudo cambiar el estado'),
    });
  }

  /** ===== Helpers ===== */
  iniciales(nombre: string | null | undefined): string {
    if (!nombre) {
      return '?';
    }
    const partes = nombre.trim().split(/\s+/);
    const primera = partes[0]?.charAt(0) ?? '';
    const segunda = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (primera + segunda).toUpperCase();
  }

  campoInvalido(campo: string): boolean {
    const control = this.formCliente.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
