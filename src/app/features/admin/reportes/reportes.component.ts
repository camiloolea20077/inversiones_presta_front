import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartModule } from 'primeng/chart';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { forkJoin } from 'rxjs';
import { LayoutService } from '../../../core/services/layout.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { PresupuestoService } from '../../../core/services/presupuesto.service';
import { PrestamoService } from '../../../core/services/prestamo.service';
import { Rentabilidad } from '../../../core/models/reporte.model';
import {
  ETIQUETA_MOVIMIENTO_PRESUPUESTO,
  MovimientoPresupuesto,
  Presupuesto,
} from '../../../core/models/presupuesto.model';
import { PrestamoRow } from '../../../core/models/prestamo.model';

Chart.register(ChartDataLabels);

/**
 * Reporte de rentabilidad del administrador. Muestra el capital aportado,
 * cuánto se ha prestado, cuánto se ha recuperado, intereses ya cobrados,
 * intereses proyectados, % de rentabilidad realizada y proyectada, y la
 * cartera en mora.
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, ChartModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  private readonly service = inject(ReporteService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly prestamoService = inject(PrestamoService);
  private readonly layout = inject(LayoutService);
  private readonly toast = inject(MessageService);

  readonly cargando = signal(true);
  readonly exportando = signal(false);
  readonly rentabilidad = signal<Rentabilidad | null>(null);

  fechaCorte = '';

  ngOnInit(): void {
    this.layout.configurar(
      'Reportes',
      'Rentabilidad y desempeño del capital del administrador',
    );
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.rentabilidad(this.fechaCorte || undefined).subscribe({
      next: (data) => {
        this.rentabilidad.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        const detail =
          (err as { error?: { message?: string } })?.error?.message ??
          'No se pudo cargar el reporte';
        this.toast.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  /** KPIs principales (capital y caja). */
  readonly kpisCapital = computed(() => {
    const r = this.rentabilidad();
    if (!r) return [];
    return [
      {
        label: 'Capital aportado',
        valor: this.moneda(r.capitalAportado),
        icon: 'pi pi-briefcase',
        tone: 'blue',
        hint: 'Monto inicial + capitalizaciones',
      },
      {
        label: 'Saldo disponible',
        valor: this.moneda(r.saldoDisponible),
        icon: 'pi pi-wallet',
        tone: 'green',
        hint: 'Caja del administrador',
      },
      {
        label: 'Capital en la calle',
        valor: this.moneda(r.capitalEnCalle),
        icon: 'pi pi-clock',
        tone: 'amber',
        hint: 'Capital sin recuperar',
      },
      {
        label: 'Capital recuperado',
        valor: this.moneda(r.capitalRecuperado),
        icon: 'pi pi-undo',
        tone: 'cyan',
        hint: 'Ya regresó a caja',
      },
    ];
  });

  /** KPIs de rentabilidad. */
  readonly kpisRentabilidad = computed(() => {
    const r = this.rentabilidad();
    if (!r) return [];
    return [
      {
        label: 'Intereses cobrados',
        valor: this.moneda(r.interesesCobrados),
        icon: 'pi pi-arrow-down-right',
        tone: 'green',
        hint: 'Rentabilidad realizada hasta hoy',
      },
      {
        label: 'Intereses por cobrar',
        valor: this.moneda(r.interesesPorCobrar),
        icon: 'pi pi-hourglass',
        tone: 'amber',
        hint: 'De los préstamos activos',
      },
      {
        label: 'Rentabilidad realizada',
        valor: this.porcentaje(r.rentabilidadRealizadaPorcentaje),
        icon: 'pi pi-chart-line',
        tone: 'green',
        hint: 'Intereses cobrados / capital aportado',
      },
      {
        label: 'Rentabilidad proyectada',
        valor: this.porcentaje(r.rentabilidadProyectadaPorcentaje),
        icon: 'pi pi-chart-bar',
        tone: 'purple',
        hint: 'Si se cobra todo lo activo',
      },
    ];
  });

  /** KPIs de cartera / mora. */
  readonly kpisCartera = computed(() => {
    const r = this.rentabilidad();
    if (!r) return [];
    return [
      {
        label: 'Cartera activa',
        valor: this.moneda(r.carteraActiva),
        icon: 'pi pi-folder',
        tone: 'blue',
        hint: 'Por cobrar (capital + intereses)',
      },
      {
        label: 'Préstamos activos',
        valor: this.numero(r.prestamosActivos),
        icon: 'pi pi-list',
        tone: 'cyan',
        hint: 'Cantidad de créditos vigentes',
      },
      {
        label: 'Total en mora',
        valor: this.moneda(r.totalEnMora),
        icon: 'pi pi-exclamation-triangle',
        tone: 'red',
        hint: this.porcentaje(r.porcentajeMora) + ' de la cartera activa',
      },
      {
        label: 'Clientes en mora',
        valor: this.numero(r.clientesEnMora),
        icon: 'pi pi-user',
        tone: 'red',
        hint: 'Clientes con cuotas vencidas',
      },
    ];
  });

  /** Datos del gráfico de composición del capital. */
  readonly composicionCapital = computed(() => {
    const r = this.rentabilidad();
    if (!r) return null;
    return {
      labels: ['Saldo disponible', 'Capital en la calle'],
      datasets: [
        {
          data: [r.saldoDisponible, r.capitalEnCalle],
          backgroundColor: ['#16a34a', '#0b53d7'],
          borderWidth: 0,
        },
      ],
    };
  });

  readonly composicionOptions = {
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom' as const },
      datalabels: { display: false },
    },
  };

  /** Datos del gráfico de barras intereses cobrados vs por cobrar. */
  readonly interesesData = computed(() => {
    const r = this.rentabilidad();
    if (!r) return null;
    return {
      labels: ['Intereses'],
      datasets: [
        {
          label: 'Cobrados',
          data: [r.interesesCobrados],
          backgroundColor: '#16a34a',
          borderRadius: 5,
        },
        {
          label: 'Por cobrar',
          data: [r.interesesPorCobrar],
          backgroundColor: '#94a3b8',
          borderRadius: 5,
        },
      ],
    };
  });

  readonly interesesOptions = {
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { position: 'bottom' as const },
      datalabels: { display: false },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
          callback: (value: number | string) => '$' + Number(value).toLocaleString('es-CO'),
        },
        grid: { color: '#eef1f6' },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
    },
  };

  /** Genera y descarga un reporte profesional en Excel (offline). */
  exportarExcel(): void {
    const r = this.rentabilidad();
    if (!r) {
      this.toast.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay reporte para exportar.',
      });
      return;
    }

    this.exportando.set(true);

    // Trae también los movimientos del presupuesto y los préstamos activos
    // para armar un reporte multi-hoja completo.
    forkJoin({
      presupuesto: this.presupuestoService.obtener(),
      prestamosActivos: this.prestamoService.listar({
        page: 0,
        rows: 1000,
        params: { estado: 'ACTIVO' },
      }),
    }).subscribe({
      next: ({ presupuesto, prestamosActivos }) => {
        this.construirWorkbook(r, presupuesto, prestamosActivos.content ?? [])
          .then(() => this.exportando.set(false))
          .catch(() => this.exportando.set(false));
      },
      error: () => {
        // Si falla la carga adicional, igual exportamos lo que tenemos.
        this.construirWorkbook(r, null, [])
          .then(() => this.exportando.set(false))
          .catch(() => this.exportando.set(false));
      },
    });
  }

  private async construirWorkbook(
    r: Rentabilidad,
    presupuesto: Presupuesto | null,
    prestamosActivos: PrestamoRow[],
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Recaudo Diario';
    workbook.created = new Date();

    this.construirHojaResumen(workbook, r);
    this.construirHojaMovimientos(workbook, presupuesto?.movimientos ?? []);
    this.construirHojaPrestamos(workbook, prestamosActivos);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const nombre = `reporte-rentabilidad-${r.fechaCorte}.xlsx`;
    saveAs(blob, nombre);

    this.toast.add({
      severity: 'success',
      summary: 'Reporte generado',
      detail: `Se descargó ${nombre}`,
    });
  }

  /* ===================== Hoja 1: Resumen Ejecutivo ===================== */
  private construirHojaResumen(
    workbook: ExcelJS.Workbook,
    r: Rentabilidad,
  ): void {
    const sheet = workbook.addWorksheet('Resumen Ejecutivo', {
      views: [{ showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    sheet.columns = [
      { width: 4 },
      { width: 38 },
      { width: 22 },
      { width: 22 },
      { width: 6 },
    ];

    // Encabezado corporativo
    sheet.mergeCells('B2:D2');
    const titulo = sheet.getCell('B2');
    titulo.value = 'REPORTE DE RENTABILIDAD';
    titulo.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titulo.alignment = { vertical: 'middle', horizontal: 'center' };
    titulo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B53D7' },
    };
    sheet.getRow(2).height = 32;

    sheet.mergeCells('B3:D3');
    const sub = sheet.getCell('B3');
    sub.value = 'Sistema de Recaudo Diario · Caja del administrador';
    sub.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
    sub.alignment = { vertical: 'middle', horizontal: 'center' };
    sub.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };
    sheet.getRow(3).height = 18;

    // Metadatos
    this.metaCell(sheet, 'B5', 'Fecha de corte', r.fechaCorte);
    this.metaCell(sheet, 'B6', 'Generado el', new Date().toLocaleString('es-CO'));

    let fila = 8;

    fila = this.bloqueSeccion(sheet, fila, 'CAPITAL DEL ADMINISTRADOR', [
      ['Capital aportado', r.capitalAportado, 'currency', 'destacar'],
      ['Saldo disponible', r.saldoDisponible, 'currency', 'destacar'],
      ['Capital prestado histórico', r.capitalPrestadoHistorico, 'currency'],
      ['Capital en la calle', r.capitalEnCalle, 'currency'],
      ['Capital recuperado', r.capitalRecuperado, 'currency'],
    ]);

    fila = this.bloqueSeccion(sheet, fila, 'RENTABILIDAD', [
      ['Intereses proyectados totales', r.interesesProyectadosTotales, 'currency'],
      ['Intereses cobrados', r.interesesCobrados, 'currency', 'destacar'],
      ['Intereses por cobrar', r.interesesPorCobrar, 'currency'],
      ['Rentabilidad realizada', r.rentabilidadRealizadaPorcentaje, 'percent', 'destacar'],
      ['Rentabilidad proyectada', r.rentabilidadProyectadaPorcentaje, 'percent'],
    ]);

    fila = this.bloqueSeccion(sheet, fila, 'CARTERA Y MORA', [
      ['Cartera activa (por cobrar)', r.carteraActiva, 'currency'],
      ['Préstamos activos', r.prestamosActivos, 'integer'],
      ['Préstamos pagados', r.prestamosPagados, 'integer'],
      ['Total en mora', r.totalEnMora, 'currency', 'alerta'],
      ['Clientes en mora', r.clientesEnMora, 'integer'],
      ['% Mora sobre cartera', r.porcentajeMora, 'percent', 'alerta'],
    ]);

    // Pie de página
    fila += 1;
    sheet.mergeCells(`B${fila}:D${fila}`);
    const pie = sheet.getCell(`B${fila}`);
    pie.value =
      'Documento generado automáticamente. Los valores se calculan en tiempo real con base en préstamos y pagos registrados.';
    pie.font = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF6B7280' } };
    pie.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
    sheet.getRow(fila).height = 28;
  }

  /** Inserta un bloque "Sección + tabla" y devuelve la siguiente fila libre. */
  private bloqueSeccion(
    sheet: ExcelJS.Worksheet,
    filaInicio: number,
    titulo: string,
    items: [string, number, 'currency' | 'percent' | 'integer', ('destacar' | 'alerta')?][],
  ): number {
    sheet.mergeCells(`B${filaInicio}:D${filaInicio}`);
    const headerSec = sheet.getCell(`B${filaInicio}`);
    headerSec.value = titulo;
    headerSec.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerSec.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    headerSec.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' },
    };
    sheet.getRow(filaInicio).height = 22;

    // Encabezado de la tabla
    const headerRow = filaInicio + 1;
    const h1 = sheet.getCell(`B${headerRow}`);
    const h2 = sheet.getCell(`C${headerRow}`);
    h1.value = 'Concepto';
    h2.value = 'Valor';
    [h1, h2].forEach((c) => {
      c.font = { bold: true, color: { argb: 'FF1F2937' }, size: 10 };
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c.border = this.bordeFino();
    });
    h2.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    sheet.getRow(headerRow).height = 18;

    items.forEach((item, idx) => {
      const fila = headerRow + 1 + idx;
      const [label, valor, tipo, modo] = item;
      const colorFila = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

      const cellLabel = sheet.getCell(`B${fila}`);
      const cellVal = sheet.getCell(`C${fila}`);
      cellLabel.value = label;
      cellVal.value = valor;

      cellLabel.font = { size: 10, color: { argb: 'FF111827' } };
      cellLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cellLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorFila } };

      cellVal.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
      cellVal.font = { size: 10 };
      cellVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorFila } };

      if (tipo === 'currency') {
        cellVal.numFmt = '"$ "#,##0';
      } else if (tipo === 'percent') {
        cellVal.numFmt = '0.00"%"';
      } else {
        cellVal.numFmt = '#,##0';
      }

      if (modo === 'destacar') {
        cellVal.font = { size: 11, bold: true, color: { argb: 'FF065F46' } };
      } else if (modo === 'alerta' && Number(valor) > 0) {
        cellVal.font = { size: 11, bold: true, color: { argb: 'FFB91C1C' } };
      }

      cellLabel.border = this.bordeFino();
      cellVal.border = this.bordeFino();
      sheet.getRow(fila).height = 18;
    });

    return headerRow + items.length + 2;
  }

  /* ===================== Hoja 2: Movimientos ===================== */
  private construirHojaMovimientos(
    workbook: ExcelJS.Workbook,
    movimientos: MovimientoPresupuesto[],
  ): void {
    const sheet = workbook.addWorksheet('Movimientos', {
      views: [{ showGridLines: false }],
    });

    sheet.columns = [
      { width: 4 },
      { header: 'Fecha', key: 'fecha', width: 22 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Valor', key: 'valor', width: 18 },
      { header: 'Observación', key: 'obs', width: 50 },
    ];

    this.tituloHoja(sheet, 'B', 'E', 'MOVIMIENTOS DEL PRESUPUESTO');

    // Header de la tabla
    const headerRow = sheet.getRow(4);
    ['Fecha', 'Tipo', 'Valor', 'Observación'].forEach((h, i) => {
      const cell = headerRow.getCell(i + 2);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B53D7' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = this.bordeFino();
    });
    headerRow.height = 22;

    if (movimientos.length === 0) {
      sheet.mergeCells('B5:E5');
      const v = sheet.getCell('B5');
      v.value = 'Aún no se han registrado movimientos en el presupuesto.';
      v.font = { italic: true, color: { argb: 'FF6B7280' }, size: 10 };
      v.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(5).height = 24;
      return;
    }

    movimientos.forEach((m, idx) => {
      const fila = 5 + idx;
      const colorFila = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      const row = sheet.getRow(fila);

      row.getCell(2).value = new Date(m.fechaMovimiento);
      row.getCell(2).numFmt = 'dd/mm/yyyy hh:mm';
      row.getCell(3).value = ETIQUETA_MOVIMIENTO_PRESUPUESTO[m.tipo] ?? m.tipo;
      row.getCell(4).value = m.valor;
      row.getCell(4).numFmt = '"$ "#,##0';
      row.getCell(5).value = m.observacion ?? '—';

      for (let c = 2; c <= 5; c++) {
        row.getCell(c).font = { size: 10 };
        row.getCell(c).alignment = {
          vertical: 'middle',
          horizontal: c === 4 ? 'right' : 'left',
          indent: 1,
        };
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorFila },
        };
        row.getCell(c).border = this.bordeFino();
      }

      // Pinta el badge del tipo
      const cellTipo = row.getCell(3);
      if (m.tipo === 'RETIRO') {
        cellTipo.font = { size: 10, bold: true, color: { argb: 'FFB91C1C' } };
      } else if (m.tipo === 'APERTURA' || m.tipo === 'CAPITALIZACION') {
        cellTipo.font = { size: 10, bold: true, color: { argb: 'FF065F46' } };
      }

      row.height = 18;
    });
  }

  /* ===================== Hoja 3: Préstamos activos ===================== */
  private construirHojaPrestamos(
    workbook: ExcelJS.Workbook,
    prestamos: PrestamoRow[],
  ): void {
    const sheet = workbook.addWorksheet('Préstamos Activos', {
      views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
    });

    sheet.columns = [
      { width: 4 },
      { width: 7 },
      { width: 26 },
      { width: 18 },
      { width: 22 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 8 },
      { width: 14 },
    ];

    this.tituloHoja(sheet, 'B', 'K', 'PRÉSTAMOS ACTIVOS');

    const encabezados = [
      'ID',
      'Cliente',
      'Ruta',
      'Trabajador',
      'Monto prestado',
      'Total a pagar',
      'Saldo actual',
      'Cuota diaria',
      'Plazo',
      'Fecha inicio',
    ];
    const headerRow = sheet.getRow(4);
    encabezados.forEach((h, i) => {
      const cell = headerRow.getCell(i + 2);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B53D7' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = this.bordeFino();
    });
    headerRow.height = 22;

    if (prestamos.length === 0) {
      sheet.mergeCells('B5:K5');
      const v = sheet.getCell('B5');
      v.value = 'No hay préstamos activos a la fecha del reporte.';
      v.font = { italic: true, color: { argb: 'FF6B7280' }, size: 10 };
      v.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(5).height = 24;
      return;
    }

    let totalPrestado = 0;
    let totalSaldo = 0;
    let totalPagar = 0;

    prestamos.forEach((p, idx) => {
      const fila = 5 + idx;
      const colorFila = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      const row = sheet.getRow(fila);

      row.getCell(2).value = p.id;
      row.getCell(3).value = p.cliente;
      row.getCell(4).value = p.ruta ?? '—';
      row.getCell(5).value = p.trabajador ?? '—';
      row.getCell(6).value = p.monto_prestado;
      row.getCell(7).value = p.total_pagar;
      row.getCell(8).value = p.saldo_actual;
      row.getCell(9).value = p.cuota_diaria;
      row.getCell(10).value = p.plazo_dias;
      row.getCell(11).value = p.fecha_inicio ?? '—';

      for (let c = 2; c <= 11; c++) {
        row.getCell(c).font = { size: 9.5 };
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorFila },
        };
        row.getCell(c).border = this.bordeFino();
      }

      // Alineaciones por tipo
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 6; c <= 9; c++) {
        row.getCell(c).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        row.getCell(c).numFmt = '"$ "#,##0';
      }
      for (let c = 3; c <= 5; c++) {
        row.getCell(c).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      }

      totalPrestado += p.monto_prestado;
      totalPagar += p.total_pagar;
      totalSaldo += p.saldo_actual;
      row.height = 17;
    });

    // Fila de totales
    const filaTotal = 5 + prestamos.length;
    const rowTotal = sheet.getRow(filaTotal);
    rowTotal.getCell(2).value = '';
    sheet.mergeCells(`B${filaTotal}:E${filaTotal}`);
    const cellTit = sheet.getCell(`B${filaTotal}`);
    cellTit.value = 'TOTALES';
    cellTit.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cellTit.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' },
    };
    cellTit.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    cellTit.border = this.bordeFino();

    rowTotal.getCell(6).value = totalPrestado;
    rowTotal.getCell(7).value = totalPagar;
    rowTotal.getCell(8).value = totalSaldo;
    for (let c = 6; c <= 8; c++) {
      const cell = rowTotal.getCell(c);
      cell.font = { bold: true, size: 10, color: { argb: 'FF1F2937' } };
      cell.numFmt = '"$ "#,##0';
      cell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      cell.border = this.bordeFino();
    }
    for (let c = 9; c <= 11; c++) {
      const cell = rowTotal.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      cell.border = this.bordeFino();
    }
    rowTotal.height = 22;
  }

  /* ===================== Helpers de estilo ===================== */
  private metaCell(
    sheet: ExcelJS.Worksheet,
    addr: string,
    label: string,
    value: string,
  ): void {
    const cell = sheet.getCell(addr);
    cell.value = { richText: [
      { text: `${label}: `, font: { bold: true, color: { argb: 'FF334155' }, size: 10 } },
      { text: value, font: { color: { argb: 'FF111827' }, size: 10 } },
    ]} as ExcelJS.CellRichTextValue;
  }

  private tituloHoja(
    sheet: ExcelJS.Worksheet,
    colIni: string,
    colFin: string,
    texto: string,
  ): void {
    sheet.mergeCells(`${colIni}2:${colFin}2`);
    const cell = sheet.getCell(`${colIni}2`);
    cell.value = texto;
    cell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B53D7' },
    };
    sheet.getRow(2).height = 30;
  }

  private bordeFino(): Partial<ExcelJS.Borders> {
    const color = { argb: 'FFE2E8F0' };
    return {
      top: { style: 'thin', color },
      left: { style: 'thin', color },
      right: { style: 'thin', color },
      bottom: { style: 'thin', color },
    };
  }

  private moneda(valor: number | null | undefined): string {
    return '$ ' + Math.round(valor ?? 0).toLocaleString('es-CO');
  }

  private numero(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('es-CO');
  }

  private porcentaje(valor: number | null | undefined): string {
    const n = valor ?? 0;
    return n.toFixed(2) + ' %';
  }
}
