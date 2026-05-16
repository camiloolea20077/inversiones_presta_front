export type { PageableRequest, SpringPage } from './trabajador.model';

/** Fila del listado de clientes (proyección del backend). */
export interface ClienteRow {
  id: number;
  documento: string | null;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  estado: string;
  ruta: string | null;
  ruta_id: number | null;
  fecha_registro: string | null;
}

/** Detalle de un cliente. */
export interface Cliente {
  id: number;
  documento: string | null;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  observacion: string | null;
  estado: string;
  activo: boolean;
  fechaRegistro: string | null;
  ruta: string | null;
}

/** Datos para crear o actualizar un cliente. */
export interface ClienteRequest {
  documento?: string | null;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  barrio?: string | null;
  observacion?: string | null;
  estado?: string | null;
}

/** Cliente reducido para selects/combos. */
export interface ClienteComboDto {
  id: number;
  nombre: string;
  documento: string | null;
}

/** Cliente dentro del recorrido de una ruta. */
export interface RutaClienteRow {
  id: number;
  cliente_id: number;
  orden: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
}
