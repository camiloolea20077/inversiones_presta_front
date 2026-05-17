export type { PageableRequest, SpringPage } from './trabajador.model';

/** Fila del registro de auditoría (HU-FE-022). */
export interface AuditoriaRow {
  id: number;
  /** Fecha y hora del evento (ISO). */
  fecha: string | null;
  usuario_id: number | null;
  usuario: string | null;
  /** Acción ejecutada: CREAR, PAGAR, REORDENAR, INSERTAR_EN_RUTA, CERRAR_CAJA… */
  accion: string;
  tabla_afectada: string;
  registro_id: number | null;
  observacion: string | null;
  /** Estado anterior del registro como JSON (texto). Puede ser null. */
  valor_anterior: string | null;
  /** Estado nuevo del registro como JSON (texto). Puede ser null. */
  valor_nuevo: string | null;
}

/** Usuario con eventos en el registro de auditoría, para el filtro por usuario. */
export interface AuditoriaUsuario {
  id: number;
  nombre: string;
}
