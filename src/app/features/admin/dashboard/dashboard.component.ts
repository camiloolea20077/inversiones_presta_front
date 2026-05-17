import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '../../../core/services/layout.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardResumen, DashboardRuta } from '../../../core/models/dashboard.model';

Chart.register(ChartDataLabels);

interface Kpi {
  label: string;
  valor: string;
  icon: string;
  tone: string;
  link: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly dashboardService = inject(DashboardService);
  readonly router = inject(Router);

  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly resumen = signal<DashboardResumen | null>(null);

  ngOnInit(): void {
    this.layout.configurar(
      'Panel Administrativo',
      'Resumen general del sistema al día de hoy',
      { label: 'Nuevo préstamo', icon: 'pi pi-plus', run: () => this.router.navigate(['/admin/prestamos']) },
    );
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.dashboardService.resumen().subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  readonly kpis = computed<Kpi[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      { label: 'Total prestado', valor: this.moneda(r.totalPrestado), icon: 'pi pi-dollar', tone: 'blue', link: '/admin/prestamos' },
      { label: 'Recaudo de hoy', valor: this.moneda(r.totalRecaudadoHoy), icon: 'pi pi-money-bill', tone: 'green', link: '/admin/pagos' },
      { label: 'Cartera activa', valor: this.moneda(r.carteraActiva), icon: 'pi pi-folder', tone: 'amber', link: '/admin/prestamos' },
      { label: 'Clientes en mora', valor: this.numero(r.clientesEnMora), icon: 'pi pi-user', tone: 'red', link: '/admin/mora' },
      { label: 'Rutas activas', valor: this.numero(r.rutasActivas), icon: 'pi pi-map', tone: 'purple', link: '/admin/rutas' },
      { label: 'Trabajadores activos', valor: this.numero(r.trabajadoresActivos), icon: 'pi pi-users', tone: 'cyan', link: '/admin/trabajadores' },
    ];
  });

  readonly recaudoStats = computed(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      { label: 'Recaudo esperado', valor: this.moneda(r.recaudoEsperado) },
      { label: 'Recaudo real', valor: this.moneda(r.recaudoReal) },
      { label: 'Cumplimiento', valor: this.numero(r.cumplimientoPorcentaje) + '%' },
      { label: 'Diferencia', valor: this.moneda(r.diferenciaRecaudo) },
    ];
  });

  readonly rutas = computed<DashboardRuta[]>(() => this.resumen()?.resumenRutas ?? []);

  readonly barData = computed(() => {
    const rutas = this.rutas();
    return {
      labels: rutas.map((x) => x.ruta),
      datasets: [
        {
          label: 'Esperado',
          data: rutas.map((x) => x.total_esperado),
          backgroundColor: '#cbd5e1',
          borderRadius: 5,
          barPercentage: 0.62,
          categoryPercentage: 0.6,
        },
        {
          label: 'Recaudo real',
          data: rutas.map((x) => x.total_recaudado),
          backgroundColor: '#0b53d7',
          borderRadius: 5,
          barPercentage: 0.62,
          categoryPercentage: 0.6,
        },
      ],
    };
  });

  readonly barOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, datalabels: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#eef1f6' },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (value: number | string) => '$' + Number(value).toLocaleString('es-CO'),
        },
      },
    },
  };

  estadoLabel(estado: string): string {
    switch (estado) {
      case 'ABIERTO':
        return 'En ruta';
      case 'EN_PROCESO':
        return 'En proceso';
      case 'CERRADO':
        return 'Completada';
      case 'SIN_PLANILLA':
        return 'Sin planilla';
      default:
        return estado;
    }
  }

  estadoClase(estado: string): string {
    switch (estado) {
      case 'CERRADO':
        return 'badge--done';
      case 'SIN_PLANILLA':
        return 'badge--muted';
      default:
        return '';
    }
  }

  irRutas(): void {
    this.router.navigate(['/admin/rutas']);
  }

  irPagos(): void {
    this.router.navigate(['/admin/pagos']);
  }

  irRuta(ruta: DashboardRuta): void {
    this.router.navigate(['/admin/rutas'], { queryParams: { rutaId: ruta.ruta_id } });
  }

  private moneda(valor: number | null | undefined): string {
    const n = valor ?? 0;
    return '$ ' + Math.round(n).toLocaleString('es-CO');
  }

  private numero(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('es-CO');
  }
}
