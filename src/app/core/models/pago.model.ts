export type { PageableRequest, SpringPage } from './trabajador.model';

/** Fila del listado de pagos del administrador (HU-FE-019). */
export interface PagoRow {
  id: number;
  fecha_pago: string;
  cliente_id: number;
  cliente: string;
  trabajador_id: number;
  trabajador: string | null;
  ruta_id: number;
  ruta: string | null;
  valor_pago: number;
  forma_pago: string;
  estado: string;
  prestamo_id: number;
}

/** Detalle de un pago registrado (HU-FE-019). */
export interface PagoDetalle {
  id: number;
  fechaPago: string;
  clienteId: number;
  clienteNombre: string | null;
  clienteDocumento: string | null;
  clienteTelefono: string | null;
  trabajadorId: number;
  trabajadorNombre: string | null;
  rutaId: number;
  rutaNombre: string | null;
  prestamoId: number;
  prestamoMonto: number | null;
  prestamoTotalPagar: number | null;
  prestamoSaldoActual: number | null;
  prestamoEstado: string | null;
  cuotaPrestamoId: number | null;
  numeroCuota: number | null;
  recaudoDetalleId: number | null;
  valorPago: number;
  formaPago: string;
  estado: string;
  observacion: string | null;
}

/** Formas de pago admitidas. */
export const FORMAS_PAGO = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'NEQUI',
  'DAVIPLATA',
  'OTRO',
] as const;

export interface RegistrarPagoRequest {
  recaudoDetalleId: number;
  valorPago: number;
  formaPago: string;
  observacion?: string | null;
}

export interface MarcarNoPagoRequest {
  recaudoDetalleId: number;
  observacion?: string | null;
}

export interface PagoResponse {
  id: number | null;
  prestamoId: number | null;
  recaudoDetalleId: number;
  clienteId: number;
  clienteNombre: string | null;
  valorPago: number | null;
  formaPago: string | null;
  estado: string | null;
  fechaPago: string | null;
  detalleEstado: string;
  saldoPrestamo: number;
  prestamoEstado: string | null;
}
