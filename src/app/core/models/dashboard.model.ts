export interface DashboardRuta {
  ruta_id: number;
  ruta: string;
  zona: string | null;
  trabajador: string | null;
  clientes: number;
  total_esperado: number;
  total_recaudado: number;
  progreso: number;
  estado: string;
}

export interface DashboardResumen {
  totalPrestado: number;
  totalRecaudadoHoy: number;
  carteraActiva: number;
  clientesEnMora: number;
  rutasActivas: number;
  trabajadoresActivos: number;
  recaudoEsperado: number;
  recaudoReal: number;
  cumplimientoPorcentaje: number;
  diferenciaRecaudo: number;
  resumenRutas: DashboardRuta[];
}
