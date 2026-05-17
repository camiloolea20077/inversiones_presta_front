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
  /** Saldo del préstamo activo más reciente; null si no tiene. */
  prestamo_activo: number | null;
  /** Cantidad de préstamos en estado ACTIVO. */
  prestamos_activos: number | null;
  /** Días de mora del cliente (0 si está al día). */
  dias_mora: number | null;
}

/** Préstamo activo del cliente dentro del detalle. */
export interface ClientePrestamo {
  id: number;
  monto_prestado: number;
  tasa_porcentaje: number;
  tipo_interes: string;
  valor_interes: number;
  total_pagar: number;
  cuota_diaria: number;
  saldo_actual: number;
  plazo_dias: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string;
  cuotas_total: number;
  cuotas_pagadas: number;
  dias_transcurridos: number;
  dias_mora: number;
}

/** Pago reciente del cliente dentro del detalle. */
export interface ClientePago {
  id: number;
  fecha_pago: string | null;
  valor_pago: number;
  forma_pago: string;
  estado: string;
}

/** Detalle completo del cliente para la pantalla "Clientes y Préstamos". */
export interface ClienteDetalle {
  id: number;
  documento: string | null;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  observacion: string | null;
  estado: string;
  activo: boolean;
  fecha_registro: string | null;
  ruta: string | null;
  prestamos_totales: number;
  prestamos_activos: number;
  dias_mora: number;
  total_pagado: number;
  cuotas_pagadas: number;
  cuotas_totales: number;
  prestamo_activo: ClientePrestamo | null;
  pagos_recientes: ClientePago[];
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
