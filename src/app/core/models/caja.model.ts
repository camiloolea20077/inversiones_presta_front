/** Renglón de un movimiento de caja (HU-BE-016). */
export interface MovimientoCaja {
  id: number;
  tipoMovimiento: string;
  valor: number;
  referenciaTipo: string | null;
  referenciaId: number | null;
  fechaMovimiento: string;
  observacion: string | null;
}

/** Estado completo de la caja diaria del trabajador (HU-BE-015 / HU-FE-011). */
export interface CajaDiaria {
  id: number;
  trabajadorId: number;
  trabajadorNombre: string | null;
  rutaId: number;
  rutaNombre: string | null;
  fechaCaja: string;
  valorInicial: number;
  valorPrestamosEntregados: number;
  valorRecaudado: number;
  valorEsperadoCierre: number;
  valorEntregado: number;
  diferencia: number;
  estado: string;
  observacion: string | null;
  movimientos: MovimientoCaja[];
}

export interface AbrirCajaRequest {
  trabajadorId: number;
  rutaId?: number | null;
  fecha?: string | null;
  valorInicial: number;
  observacion?: string | null;
}

export interface CerrarCajaRequest {
  cajaId: number;
  valorEntregado: number;
  observacion?: string | null;
}

/** Fila del listado de cajas diarias para el administrador (HU-FE-020). */
export interface CajaRow {
  id: number;
  trabajador_id: number;
  trabajador: string | null;
  ruta_id: number;
  ruta: string | null;
  fecha_caja: string;
  valor_inicial: number;
  valor_prestamos_entregados: number;
  valor_recaudado: number;
  valor_esperado_cierre: number;
  valor_entregado: number;
  diferencia: number;
  estado: string;
  observacion: string | null;
}

/** Etiquetas legibles de cada tipo de movimiento. */
export const ETIQUETA_MOVIMIENTO: Record<string, string> = {
  CAJA_INICIAL: 'Caja inicial',
  PRESTAMO_ENTREGADO: 'Préstamo entregado',
  PAGO_RECIBIDO: 'Pago recibido',
  AJUSTE: 'Ajuste',
  CIERRE_CAJA: 'Cierre de caja',
  ANULACION_PAGO: 'Anulación de pago',
  ANULACION_PRESTAMO: 'Anulación de préstamo',
};
