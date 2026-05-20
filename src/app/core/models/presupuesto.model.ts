/** Movimiento del presupuesto del administrador. */
export interface MovimientoPresupuesto {
  id: number;
  tipo: 'APERTURA' | 'CAPITALIZACION' | 'RETIRO' | 'AJUSTE';
  valor: number;
  observacion: string | null;
  fechaMovimiento: string;
}

/** Estado completo del presupuesto del administrador. */
export interface Presupuesto {
  id: number;
  montoInicial: number;
  fechaApertura: string;
  observacion: string | null;
  estado: 'ACTIVO' | 'CERRADO';
  capitalAportado: number;
  saldoDisponible: number;
  totalPrestado: number;
  totalRecaudado: number;
  capitalEnCalle: number;
  movimientos: MovimientoPresupuesto[];
}

export interface AbrirPresupuestoRequest {
  montoInicial: number;
  observacion?: string | null;
}

export interface MovimientoPresupuestoRequest {
  valor: number;
  observacion?: string | null;
}

export const ETIQUETA_MOVIMIENTO_PRESUPUESTO: Record<string, string> = {
  APERTURA: 'Apertura',
  CAPITALIZACION: 'Capitalización',
  RETIRO: 'Retiro',
  AJUSTE: 'Ajuste',
};
