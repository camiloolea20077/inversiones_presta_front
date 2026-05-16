import { Component, OnInit, inject } from '@angular/core';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '../../../core/services/layout.service';

Chart.register(ChartDataLabels);

interface Kpi {
  label: string;
  valor: string;
  icon: string;
  tone: string;
  trend: string;
  trendNegativo: boolean;
}

interface RutaEstado {
  codigo: string;
  nombre: string;
  responsable: string;
  progreso: number;
  recaudo: string;
  estado: 'En ruta' | 'Completada';
}

interface PagoReciente {
  n: number;
  fecha: string;
  cliente: string;
  prestamo: string;
  ruta: string;
  metodo: string;
  valor: string;
}

interface MoraTramo {
  rango: string;
  pct: number;
  valor: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly layout = inject(LayoutService);

  ngOnInit(): void {
    this.layout.configurar(
      'Panel Administrativo',
      'Resumen general del sistema al día de hoy',
      { label: 'Nuevo préstamo', icon: 'pi pi-plus', run: () => {} },
    );
  }

  readonly kpis: Kpi[] = [
    { label: 'Total prestado', valor: '$ 1.250.000.000', icon: 'pi pi-dollar', tone: 'blue', trend: '+12.5% vs ayer', trendNegativo: false },
    { label: 'Recaudo de hoy', valor: '$ 275.450.000', icon: 'pi pi-money-bill', tone: 'green', trend: '+8.7% vs ayer', trendNegativo: false },
    { label: 'Cartera activa', valor: '$ 974.550.000', icon: 'pi pi-folder', tone: 'amber', trend: '-2.3% vs ayer', trendNegativo: true },
    { label: 'Clientes en mora', valor: '128', icon: 'pi pi-user', tone: 'red', trend: '+5.8% vs ayer', trendNegativo: true },
    { label: 'Rutas activas', valor: '12', icon: 'pi pi-map', tone: 'purple', trend: '100% operativas', trendNegativo: false },
    { label: 'Trabajadores activos', valor: '24', icon: 'pi pi-users', tone: 'cyan', trend: '96% del total', trendNegativo: false },
  ];

  readonly rutas: RutaEstado[] = [
    { codigo: 'RTA-01', nombre: 'Centro', responsable: 'Juan Pérez', progreso: 85, recaudo: '$ 28.450.000', estado: 'En ruta' },
    { codigo: 'RTA-02', nombre: 'Norte', responsable: 'Sofía Ramírez', progreso: 92, recaudo: '$ 23.700.000', estado: 'En ruta' },
    { codigo: 'RTA-03', nombre: 'Sur', responsable: 'Carlos Restrepo', progreso: 78, recaudo: '$ 31.200.000', estado: 'En ruta' },
    { codigo: 'RTA-04', nombre: 'Oriente', responsable: 'Marta Núñez', progreso: 40, recaudo: '$ 18.900.000', estado: 'En ruta' },
    { codigo: 'RTA-05', nombre: 'Occidente', responsable: 'Andrés Díaz', progreso: 100, recaudo: '$ 36.950.000', estado: 'Completada' },
    { codigo: 'RTA-06', nombre: 'Rural', responsable: 'Olivia Vega', progreso: 65, recaudo: '$ 8.230.000', estado: 'En ruta' },
  ];

  readonly pagos: PagoReciente[] = [
    { n: 1, fecha: '24/05/2025 10:32 a.m.', cliente: 'Luis Alberto Torres', prestamo: 'PR-00125', ruta: 'RTA-01', metodo: 'Efectivo', valor: '$ 450.000' },
    { n: 2, fecha: '24/05/2025 10:15 a.m.', cliente: 'María Fernanda López', prestamo: 'PR-00451', ruta: 'RTA-02', metodo: 'Transferencia', valor: '$ 320.000' },
    { n: 3, fecha: '24/05/2025 09:58 a.m.', cliente: 'José Ignacio Bedoya', prestamo: 'PR-00987', ruta: 'RTA-03', metodo: 'Efectivo', valor: '$ 280.000' },
    { n: 4, fecha: '24/05/2025 09:36 a.m.', cliente: 'Ana Milena Castro', prestamo: 'PR-00312', ruta: 'RTA-02', metodo: 'Nequi', valor: '$ 150.000' },
    { n: 5, fecha: '24/05/2025 09:14 a.m.', cliente: 'Pedro Pablo Gómez', prestamo: 'PR-00549', ruta: 'RTA-01', metodo: 'Efectivo', valor: '$ 500.000' },
  ];

  readonly mora: MoraTramo[] = [
    { rango: '1 - 15 días', pct: 35, valor: '$ 125.400.000', color: '#0b53d7' },
    { rango: '16 - 30 días', pct: 25, valor: '$ 89.700.000', color: '#f5a623' },
    { rango: '31 - 60 días', pct: 20, valor: '$ 71.200.000', color: '#ef4444' },
    { rango: '61 - 90 días', pct: 10, valor: '$ 35.800.000', color: '#8b5cf6' },
    { rango: '+ 90 días', pct: 10, valor: '$ 29.500.000', color: '#22d3ee' },
  ];

  readonly recaudoStats = [
    { label: 'Recaudo esperado', valor: '$ 312.000.000' },
    { label: 'Recaudo real', valor: '$ 275.450.000' },
    { label: 'Cumplimiento', valor: '88.3%' },
    { label: 'Diferencia', valor: '$ 36.550.000' },
  ];

  readonly lineData = {
    labels: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    datasets: [
      {
        label: 'Esperado',
        data: [42, 98, 152, 214, 268, 312],
        borderColor: '#94a3b8',
        borderDash: [6, 6],
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Recaudo real',
        data: [35, 82, 128, 180, 236, 275],
        borderColor: '#0b53d7',
        backgroundColor: 'rgba(11, 83, 215, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#0b53d7',
        borderWidth: 2.5,
      },
    ],
  };

  readonly lineOptions = {
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
          callback: (value: number | string) => '$' + value + 'M',
        },
      },
    },
  };

  readonly donutData = {
    labels: this.mora.map((m) => m.rango),
    datasets: [
      {
        data: this.mora.map((m) => m.pct),
        backgroundColor: this.mora.map((m) => m.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  readonly donutOptions = {
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold' as const, size: 12 },
        formatter: (value: number) => value + '%',
      },
    },
  };
}
