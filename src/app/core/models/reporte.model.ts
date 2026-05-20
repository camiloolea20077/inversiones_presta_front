/** Reporte de rentabilidad consolidado del administrador. */
export interface Rentabilidad {
  fechaCorte: string;
  capitalAportado: number;
  saldoDisponible: number;
  capitalPrestadoHistorico: number;
  capitalEnCalle: number;
  capitalRecuperado: number;
  carteraActiva: number;
  prestamosActivos: number;
  prestamosPagados: number;
  interesesProyectadosTotales: number;
  interesesCobrados: number;
  interesesPorCobrar: number;
  rentabilidadRealizadaPorcentaje: number;
  rentabilidadProyectadaPorcentaje: number;
  totalEnMora: number;
  clientesEnMora: number;
  porcentajeMora: number;
}
