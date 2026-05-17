export type { PageableRequest, SpringPage } from './trabajador.model';

/** Fila del reporte de clientes en mora (HU-FE-021). */
export interface MoraRow {
  cliente_id: number;
  cliente: string;
  documento: string | null;
  telefono: string | null;
  ruta_id: number | null;
  ruta: string | null;
  trabajador_id: number | null;
  trabajador: string | null;
  prestamo_id: number;
  cuota_vencida_mas_antigua: string | null;
  dias_mora: number;
  cuotas_vencidas: number;
  saldo_vencido: number;
  saldo_pendiente: number;
}
