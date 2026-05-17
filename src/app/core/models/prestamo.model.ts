export type { PageableRequest, SpringPage } from './trabajador.model';

/** Fila del listado de préstamos (proyección del backend). */
export interface PrestamoRow {
  id: number;
  cliente: string;
  cliente_id: number;
  ruta: string | null;
  trabajador: string | null;
  monto_prestado: number;
  total_pagar: number;
  saldo_actual: number;
  cuota_diaria: number;
  plazo_dias: number;
  estado: string;
  fecha_inicio: string | null;
}

/** Cuota de un préstamo. */
export interface CuotaPrestamo {
  id: number;
  numeroCuota: number;
  fechaCuota: string;
  valorCuota: number;
  valorPagado: number;
  saldoCuota: number;
  estado: string;
}

/** Detalle de un préstamo. */
export interface Prestamo {
  id: number;
  clienteId: number;
  clienteNombre: string | null;
  rutaId: number;
  rutaNombre: string | null;
  trabajadorId: number;
  trabajadorNombre: string | null;
  montoPrestado: number;
  tasaPorcentaje: number;
  tipoInteres: string;
  plazoDias: number;
  valorInteres: number;
  totalPagar: number;
  cuotaDiaria: number;
  saldoActual: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: string;
  observacion: string | null;
  cuotas: CuotaPrestamo[];
}

/** Datos para crear un préstamo. */
export interface PrestamoRequest {
  clienteId: number;
  rutaId: number;
  trabajadorId: number;
  montoPrestado: number;
  tasaPorcentaje: number;
  tipoInteres: string;
  plazoDias: number;
  observacion?: string | null;
}

/** Solicitud de simulación. */
export interface SimulacionRequest {
  montoPrestado: number;
  tasaPorcentaje: number;
  tipoInteres: string;
  plazoDias: number;
}

/** Resultado de la simulación. */
export interface Simulacion {
  montoPrestado: number;
  valorInteres: number;
  totalPagar: number;
  cuotaDiaria: number;
  plazoDias: number;
}

/**
 * Datos para crear cliente nuevo + préstamo en una sola operación
 * transaccional (HU-BE-014 / HU-FE-009 / HU-FE-010).
 */
export interface ClienteConPrestamoRequest {
  documento?: string | null;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  barrio?: string | null;
  observacionCliente?: string | null;

  rutaId: number;
  /** Orden del cliente base tras el cual se inserta; null = al final. */
  ordenBase?: number | null;

  trabajadorId: number;
  montoPrestado: number;
  tasaPorcentaje: number;
  tipoInteres: string;
  plazoDias: number;
  observacionPrestamo?: string | null;
}

/** Resultado de crear cliente + préstamo en una sola operación. */
export interface ClienteConPrestamo {
  clienteId: number;
  clienteNombre: string;
  ordenAsignado: number | null;
  prestamo: Prestamo;
  recaudoDiarioId: number | null;
  planillaActualizada: boolean;
}
