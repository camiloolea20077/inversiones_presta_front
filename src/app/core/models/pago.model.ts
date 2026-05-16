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
