export type { PageableRequest, SpringPage } from './trabajador.model';

/** Fila del listado de rutas (proyección del backend). */
export interface RutaRow {
  id: number;
  nombre: string;
  zona: string | null;
  descripcion: string | null;
  estado: string;
  trabajador: string | null;
  trabajador_id: number | null;
  clientes: number;
  fecha_creacion: string | null;
}

/** Detalle de una ruta. */
export interface Ruta {
  id: number;
  nombre: string;
  zona: string | null;
  descripcion: string | null;
  activo: boolean;
  trabajadorId: number | null;
  trabajadorNombre: string | null;
  fechaAsignacion: string | null;
  clientes: number;
}

/** Ruta reducida para selects/combos. */
export interface RutaComboDto {
  id: number;
  nombre: string;
  zona: string | null;
}

/** Datos para crear o actualizar una ruta. */
export interface RutaRequest {
  nombre: string;
  zona?: string | null;
  descripcion?: string | null;
  activo?: boolean;
  trabajadorId?: number | null;
}
