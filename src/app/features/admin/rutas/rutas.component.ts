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
import { RutaService } from '../../../core/services/ruta.service';
import { TrabajadorService } from '../../../core/services/trabajador.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { RutaRequest, RutaRow } from '../../../core/models/ruta.model';
import { PageableRequest } from '../../../core/models/trabajador.model';
import { TrabajadorComboDto } from '../../../core/models/trabajador.model';
import { ClienteComboDto, RutaClienteRow } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DialogModule],
  templateUrl: './rutas.component.html',
  styleUrl: './rutas.component.scss',
})
export class RutasComponent implements OnInit {
  private readonly service = inject(RutaService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly clienteService = inject(ClienteService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<RutaRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 8;

  search = '';
  filtroEstado = '';

  /** ===== Trabajadores para selects ===== */
  readonly trabajadores = signal<TrabajadorComboDto[]>([]);

  /** ===== Selección ===== */
  readonly seleccionada = signal<RutaRow | null>(null);

  /** ===== Diálogo crear / editar ===== */
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);

  readonly tituloDialogo = computed(() =>
    this.editandoId() ? 'Editar ruta' : 'Nueva ruta',
  );

  readonly formRuta: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    zona: ['', [Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(255)]],
    activo: [true],
    trabajadorId: [null as number | null],
  });

  /** ===== Diálogo asignar trabajador ===== */
  readonly dialogAsignarVisible = signal(false);
  readonly rutaAsignar = signal<RutaRow | null>(null);
  readonly guardandoAsignar = signal(false);

  readonly formAsignar: FormGroup = this.fb.group({
    trabajadorId: [null as number | null, Validators.required],
  });

  /** ===== Orden de clientes en la ruta ===== */
  readonly clientesRuta = signal<RutaClienteRow[]>([]);
  readonly clientesCargando = signal(false);
  readonly ordenSucio = signal(false);
  readonly guardandoOrden = signal(false);

  /** ===== Diálogo insertar cliente ===== */
  readonly dialogInsertarVisible = signal(false);
  readonly guardandoInsertar = signal(false);
  readonly clientesCombo = signal<ClienteComboDto[]>([]);

  readonly formInsertar: FormGroup = this.fb.group({
    clienteId: [null as number | null, Validators.required],
    ordenBase: [null as number | null],
  });

  ngOnInit(): void {
    this.layout.configurar(
      'Gestión de Rutas',
      'Administra las rutas de cobro y los trabajadores asignados',
      { label: 'Nueva ruta', icon: 'pi pi-plus', run: () => this.nuevo() },
    );
    this.cargar();
    this.cargarTrabajadores();
  }

  private cargarTrabajadores(): void {
    this.trabajadorService.listarActivos().subscribe({
      next: (data) => this.trabajadores.set(data),
      error: () => {},
    });
  }

  /** ===== Listado ===== */
  cargar(): void {
    this.loading.set(true);
    const request: PageableRequest = {
      page: this.page(),
      rows: this.tamano,
      search: this.search.trim() || undefined,
      params: this.filtroEstado ? { estado: this.filtroEstado } : undefined,
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
        this.error(err, 'No se pudo cargar el listado de rutas');
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
    this.buscar();
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado = valor;
    this.buscar();
  }

  irPagina(destino: number): void {
    if (destino < 0 || destino >= this.totalPages()) {
      return;
    }
    this.page.set(destino);
    this.cargar();
  }

  seleccionar(row: RutaRow): void {
    this.seleccionada.set(row);
    this.cargarClientesRuta(row.id);
  }

  private sincronizarSeleccion(content: RutaRow[]): void {
    if (content.length === 0) {
      this.seleccionada.set(null);
      this.clientesRuta.set([]);
      return;
    }
    const actual = this.seleccionada();
    const refrescada = actual
      ? content.find((r) => r.id === actual.id)
      : undefined;
    const elegida = refrescada ?? content[0];
    this.seleccionada.set(elegida);
    this.cargarClientesRuta(elegida.id);
  }

  /** ===== Orden de clientes ===== */
  private cargarClientesRuta(rutaId: number): void {
    this.clientesCargando.set(true);
    this.ordenSucio.set(false);
    this.service.listarClientes(rutaId).subscribe({
      next: (data) => {
        this.clientesRuta.set(data);
        this.clientesCargando.set(false);
      },
      error: () => {
        this.clientesRuta.set([]);
        this.clientesCargando.set(false);
      },
    });
  }

  moverArriba(index: number): void {
    if (index <= 0) {
      return;
    }
    const lista = [...this.clientesRuta()];
    [lista[index - 1], lista[index]] = [lista[index], lista[index - 1]];
    this.clientesRuta.set(lista);
    this.ordenSucio.set(true);
  }

  moverAbajo(index: number): void {
    const lista = [...this.clientesRuta()];
    if (index >= lista.length - 1) {
      return;
    }
    [lista[index + 1], lista[index]] = [lista[index], lista[index + 1]];
    this.clientesRuta.set(lista);
    this.ordenSucio.set(true);
  }

  guardarOrden(): void {
    const ruta = this.seleccionada();
    if (!ruta) {
      return;
    }
    const ordenIds = this.clientesRuta().map((c) => c.id);
    this.guardandoOrden.set(true);
    this.service.reordenarClientes(ruta.id, ordenIds).subscribe({
      next: (data) => {
        this.guardandoOrden.set(false);
        this.ordenSucio.set(false);
        this.clientesRuta.set(data);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Orden del recorrido actualizado',
        });
      },
      error: (err) => {
        this.guardandoOrden.set(false);
        this.error(err, 'No se pudo guardar el orden');
      },
    });
  }

  restablecerOrden(): void {
    const ruta = this.seleccionada();
    if (ruta) {
      this.cargarClientesRuta(ruta.id);
    }
  }

  quitarCliente(rc: RutaClienteRow): void {
    const ruta = this.seleccionada();
    if (!ruta) {
      return;
    }
    this.service.quitarCliente(ruta.id, rc.id).subscribe({
      next: (data) => {
        this.clientesRuta.set(data);
        this.ordenSucio.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Cliente retirado de la ruta',
        });
        this.cargar();
      },
      error: (err) => this.error(err, 'No se pudo retirar el cliente'),
    });
  }

  abrirInsertar(): void {
    if (!this.seleccionada()) {
      return;
    }
    this.formInsertar.reset({ clienteId: null, ordenBase: null });
    this.dialogInsertarVisible.set(true);
    this.clienteService.listarActivos().subscribe({
      next: (data) => this.clientesCombo.set(data),
      error: () => {},
    });
  }

  insertarCliente(): void {
    if (this.formInsertar.invalid) {
      this.formInsertar.markAllAsTouched();
      return;
    }
    const ruta = this.seleccionada();
    if (!ruta) {
      return;
    }
    const clienteId = this.formInsertar.value.clienteId as number;
    const ordenBase = this.formInsertar.value.ordenBase as number | null;
    this.guardandoInsertar.set(true);
    this.service.insertarCliente(ruta.id, clienteId, ordenBase).subscribe({
      next: (data) => {
        this.guardandoInsertar.set(false);
        this.dialogInsertarVisible.set(false);
        this.clientesRuta.set(data);
        this.ordenSucio.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Cliente agregado a la ruta',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardandoInsertar.set(false);
        this.error(err, 'No se pudo agregar el cliente');
      },
    });
  }

  /** ===== Crear / editar ===== */
  nuevo(): void {
    this.editandoId.set(null);
    this.formRuta.reset({
      nombre: '',
      zona: '',
      descripcion: '',
      activo: true,
      trabajadorId: null,
    });
    this.dialogVisible.set(true);
  }

  editar(row: RutaRow): void {
    this.editandoId.set(row.id);
    this.formRuta.reset({
      nombre: row.nombre,
      zona: row.zona ?? '',
      descripcion: row.descripcion ?? '',
      activo: row.estado === 'ACTIVO',
      trabajadorId: row.trabajador_id ?? null,
    });
    this.dialogVisible.set(true);
  }

  guardar(): void {
    if (this.formRuta.invalid) {
      this.formRuta.markAllAsTouched();
      return;
    }
    const dto = this.formRuta.value as RutaRequest;
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
          detail: id ? 'Ruta actualizada' : 'Ruta creada',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error(err, 'No se pudo guardar la ruta');
      },
    });
  }

  toggleEstado(row: RutaRow): void {
    const activar = row.estado !== 'ACTIVO';
    this.service.cambiarEstado(row.id, activar).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: activar ? 'Ruta activada' : 'Ruta inactivada',
        });
        this.cargar();
      },
      error: (err) => this.error(err, 'No se pudo cambiar el estado'),
    });
  }

  /** ===== Asignar trabajador ===== */
  abrirAsignar(row: RutaRow): void {
    this.rutaAsignar.set(row);
    this.formAsignar.reset({ trabajadorId: row.trabajador_id ?? null });
    this.dialogAsignarVisible.set(true);
  }

  asignar(): void {
    if (this.formAsignar.invalid) {
      this.formAsignar.markAllAsTouched();
      return;
    }
    const ruta = this.rutaAsignar();
    if (!ruta) {
      return;
    }
    const trabajadorId = this.formAsignar.value.trabajadorId as number;
    this.guardandoAsignar.set(true);
    this.service.asignarTrabajador(ruta.id, trabajadorId).subscribe({
      next: () => {
        this.guardandoAsignar.set(false);
        this.dialogAsignarVisible.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Trabajador asignado a la ruta',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardandoAsignar.set(false);
        this.error(err, 'No se pudo asignar el trabajador');
      },
    });
  }

  /** ===== Helpers ===== */
  campoInvalido(form: FormGroup, campo: string): boolean {
    const control = form.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private error(err: unknown, fallback: string): void {
    const detail =
      (err as { error?: { message?: string } })?.error?.message ?? fallback;
    this.toast.add({ severity: 'error', summary: 'Error', detail });
  }
}
