/** Solicitud de paginación genérica que consume el backend (PageableDto). */
export interface PageableRequest {
  page: number;
  rows: number;
  search?: string;
  order_by?: string;
  order?: string;
  params?: Record<string, unknown>;
}

/** Estructura de página devuelta por Spring Data (PageImpl). */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Fila del listado de trabajadores (proyección del backend). */
export interface TrabajadorRow {
  id: number;
  documento: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  estado: string;
  usuario_nombre: string | null;
  usuario_correo: string | null;
  rol: string | null;
  tiene_limite: string;
  ruta_asignada: string | null;
  clientes: number;
  recaudo_hoy: number;
  fecha_ingreso: string | null;
}

/** Trabajador en formato reducido para selects/combos. */
export interface TrabajadorComboDto {
  id: number;
  nombre: string;
  documento: string;
}

/** Detalle de un trabajador. */
export interface Trabajador {
  id: number;
  documento: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  usuarioId: number | null;
  usuarioNombre: string | null;
  correo: string | null;
  usuario: string | null;
}

/** Datos para crear o actualizar un trabajador. */
export interface TrabajadorRequest {
  documento: string;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  usuarioId?: number | null;
  activo?: boolean;
  /** Acceso al sistema (opcional). */
  correo?: string | null;
  usuario?: string | null;
  password?: string | null;
}

/** Configuración de límites de préstamo de un trabajador. */
export interface LimiteTrabajadorRequest {
  montoMaximoPrestamo: number;
  tasaMinima: number;
  tasaMaxima: number;
  plazoMaximoDias: number;
  puedeCrearCliente: boolean;
  puedeCrearPrestamo: boolean;
  puedeDefinirTasa: boolean;
}

export interface LimiteTrabajador extends LimiteTrabajadorRequest {
  id: number;
  trabajadorId: number;
  activo: boolean;
}
