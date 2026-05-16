/** Renglón de la planilla diaria: un cliente del recorrido. */
export interface RecaudoDetalle {
  id: number;
  orden: number;
  clienteId: number;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  clienteDireccion: string | null;
  prestamoId: number | null;
  valorEsperado: number;
  valorPagado: number;
  saldoPendiente: number;
  estado: string;
  observacion: string | null;
}

/** Planilla diaria de recaudo de una ruta. */
export interface RecaudoDiario {
  id: number;
  rutaId: number;
  rutaNombre: string | null;
  trabajadorId: number;
  trabajadorNombre: string | null;
  fechaRecaudo: string;
  totalEsperado: number;
  totalRecaudado: number;
  estado: string;
  totalClientes: number;
  clientesPagados: number;
  clientesPendientes: number;
  clientesParciales: number;
  clientesNoPago: number;
  detalles: RecaudoDetalle[];
}
