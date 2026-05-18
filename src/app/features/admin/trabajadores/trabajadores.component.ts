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
import { TrabajadorService } from '../../../core/services/trabajador.service';
import {
  LimiteTrabajador,
  LimiteTrabajadorRequest,
  PageableRequest,
  TrabajadorRequest,
  TrabajadorRow,
} from '../../../core/models/trabajador.model';

type Pestana = 'general' | 'limites';

@Component({
  selector: 'app-trabajadores',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DialogModule],
  templateUrl: './trabajadores.component.html',
  styleUrl: './trabajadores.component.scss',
})
export class TrabajadoresComponent implements OnInit {
  private readonly service = inject(TrabajadorService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly layout = inject(LayoutService);

  /** ===== Listado ===== */
  readonly rows = signal<TrabajadorRow[]>([]);
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly tamano = 8;

  search = '';
  filtroEstado = '';

  /** ===== Selección / cards de detalle ===== */
  readonly seleccionado = signal<TrabajadorRow | null>(null);
  readonly limiteSeleccionado = signal<LimiteTrabajador | null>(null);
  readonly limiteCargando = signal(false);

  /** Recaudo de hoy promediado entre los clientes asignados. */
  readonly promedioPorCliente = computed(() => {
    const t = this.seleccionado();
    if (!t || !t.clientes) {
      return 0;
    }
    return t.recaudo_hoy / t.clientes;
  });

  /** ===== Diálogo ===== */
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly pestana = signal<Pestana>('general');
  readonly guardando = signal(false);

  readonly tituloDialogo = computed(() =>
    this.editandoId() ? 'Editar trabajador' : 'Nuevo trabajador',
  );

  /** Indica si el trabajador en edición ya tiene usuario de acceso. */
  readonly tieneUsuario = signal(false);

  readonly formGeneral: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    documento: ['', [Validators.required, Validators.maxLength(30)]],
    telefono: ['', [Validators.maxLength(30)]],
    direccion: ['', [Validators.maxLength(255)]],
    activo: [true],
    correo: ['', [Validators.email, Validators.maxLength(150)]],
    usuario: ['', [Validators.maxLength(100)]],
    password: ['', [Validators.maxLength(100)]],
  });

  readonly formLimite: FormGroup = this.fb.group({
    montoMaximoPrestamo: [0, [Validators.required, Validators.min(0)]],
    tasaMinima: [0, [Validators.required, Validators.min(0)]],
    tasaMaxima: [0, [Validators.required, Validators.min(0)]],
    plazoMaximoDias: [0, [Validators.required, Validators.min(0)]],
    puedeCrearCliente: [true],
    puedeCrearPrestamo: [true],
    puedeDefinirTasa: [true],
  });

  ngOnInit(): void {
    this.layout.configurar(
      'Gestión de Trabajadores',
      'Administra cobradores, asesores de ruta y permisos operativos',
      { label: 'Nuevo trabajador', icon: 'pi pi-plus', run: () => this.nuevo() },
    );
    this.cargar();
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
        this.error(err, 'No se pudo cargar el listado de trabajadores');
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

  /** ===== Selección ===== */
  seleccionar(row: TrabajadorRow): void {
    this.seleccionado.set(row);
    this.cargarLimiteSeleccionado(row.id);
  }

  private sincronizarSeleccion(content: TrabajadorRow[]): void {
    const actual = this.seleccionado();
    if (content.length === 0) {
      this.seleccionado.set(null);
      this.limiteSeleccionado.set(null);
      return;
    }
    const refrescado = actual
      ? content.find((t) => t.id === actual.id)
      : undefined;
    const elegido = refrescado ?? content[0];
    this.seleccionado.set(elegido);
    this.cargarLimiteSeleccionado(elegido.id);
  }

  private cargarLimiteSeleccionado(id: number): void {
    this.limiteCargando.set(true);
    this.limiteSeleccionado.set(null);
    this.service.obtenerLimite(id).subscribe({
      next: (limite) => {
        this.limiteSeleccionado.set(limite);
        this.limiteCargando.set(false);
      },
      error: () => this.limiteCargando.set(false),
    });
  }

  /** ===== Crear / editar ===== */
  nuevo(): void {
    this.editandoId.set(null);
    this.tieneUsuario.set(false);
    this.pestana.set('general');
    this.formGeneral.reset({
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      activo: true,
      correo: '',
      usuario: '',
      password: '',
    });
    this.resetLimite();
    this.dialogVisible.set(true);
  }

  editar(row: TrabajadorRow, pestana: Pestana = 'general'): void {
    this.editandoId.set(row.id);
    this.tieneUsuario.set(false);
    this.pestana.set(pestana);
    this.resetLimite();
    this.dialogVisible.set(true);

    this.service.obtener(row.id).subscribe({
      next: (t) => {
        this.tieneUsuario.set(!!t.usuarioId);
        this.formGeneral.reset({
          nombre: t.nombre,
          documento: t.documento,
          telefono: t.telefono ?? '',
          direccion: t.direccion ?? '',
          activo: t.activo,
          correo: t.correo ?? '',
          usuario: t.usuario ?? '',
          password: '',
        });
      },
      error: (err) => this.error(err, 'No se pudo cargar el trabajador'),
    });

    this.service.obtenerLimite(row.id).subscribe({
      next: (limite) => {
        if (limite) {
          this.formLimite.reset({
            montoMaximoPrestamo: limite.montoMaximoPrestamo,
            tasaMinima: limite.tasaMinima,
            tasaMaxima: limite.tasaMaxima,
            plazoMaximoDias: limite.plazoMaximoDias,
            puedeCrearCliente: limite.puedeCrearCliente,
            puedeCrearPrestamo: limite.puedeCrearPrestamo,
            puedeDefinirTasa: limite.puedeDefinirTasa,
          });
        }
      },
      error: () => {},
    });
  }

  configurarLimites(): void {
    const row = this.seleccionado();
    if (row) {
      this.editar(row, 'limites');
    }
  }

  private resetLimite(): void {
    this.formLimite.reset({
      montoMaximoPrestamo: 0,
      tasaMinima: 0,
      tasaMaxima: 0,
      plazoMaximoDias: 0,
      puedeCrearCliente: true,
      puedeCrearPrestamo: true,
      puedeDefinirTasa: true,
    });
  }

  guardar(): void {
    if (this.formGeneral.invalid) {
      this.formGeneral.markAllAsTouched();
      this.pestana.set('general');
      return;
    }

    const correo = (this.formGeneral.value.correo ?? '').trim();
    const usuario = (this.formGeneral.value.usuario ?? '').trim();
    const password = (this.formGeneral.value.password ?? '').trim();
    const quiereAcceso = !!(correo || usuario || password);
    if (quiereAcceso && !this.tieneUsuario() && (!usuario || !password)) {
      this.pestana.set('general');
      this.toast.add({
        severity: 'warn',
        summary: 'Datos de acceso incompletos',
        detail: 'Para dar acceso al sistema indica usuario y contraseña.',
      });
      return;
    }

    const guardarLimite = this.formLimite.dirty;
    if (guardarLimite && this.formLimite.invalid) {
      this.formLimite.markAllAsTouched();
      this.pestana.set('limites');
      return;
    }

    const limiteDto = this.formLimite.value as LimiteTrabajadorRequest;
    if (guardarLimite && limiteDto.tasaMaxima < limiteDto.tasaMinima) {
      this.pestana.set('limites');
      this.toast.add({
        severity: 'warn',
        summary: 'Revisa los datos',
        detail: 'La tasa máxima no puede ser menor que la mínima',
      });
      return;
    }

    const dto = this.formGeneral.value as TrabajadorRequest;
    const id = this.editandoId();
    this.guardando.set(true);

    const peticion = id
      ? this.service.actualizar(id, dto)
      : this.service.crear(dto);

    peticion.subscribe({
      next: (trabajador) => {
        if (guardarLimite) {
          this.service.guardarLimite(trabajador.id, limiteDto).subscribe({
            next: () => this.finalizarGuardado(!!id),
            error: (err) => {
              this.guardando.set(false);
              this.error(err, 'El trabajador se guardó, pero falló el límite');
            },
          });
        } else {
          this.finalizarGuardado(!!id);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.error(err, 'No se pudo guardar el trabajador');
      },
    });
  }

  private finalizarGuardado(edicion: boolean): void {
    this.guardando.set(false);
    this.dialogVisible.set(false);
    this.toast.add({
      severity: 'success',
      summary: 'Listo',
      detail: edicion ? 'Trabajador actualizado' : 'Trabajador creado',
    });
    this.cargar();
  }

  toggleEstado(row: TrabajadorRow): void {
    const activar = row.estado !== 'ACTIVO';
    this.service.cambiarEstado(row.id, activar).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: activar ? 'Trabajador activado' : 'Trabajador inactivado',
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

  moneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  porcentaje(valor: number | null | undefined): string {
    return `${valor ?? 0}%`;
  }

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
