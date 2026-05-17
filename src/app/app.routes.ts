import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

const placeholder = () =>
  import('./shared/components/placeholder/placeholder.component').then(
    (m) => m.PlaceholderComponent,
  );

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'rutas',
        loadComponent: () =>
          import('./features/admin/rutas/rutas.component').then(
            (m) => m.RutasComponent,
          ),
      },
      {
        path: 'trabajadores',
        loadComponent: () =>
          import('./features/admin/trabajadores/trabajadores.component').then(
            (m) => m.TrabajadoresComponent,
          ),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin/clientes/clientes.component').then(
            (m) => m.ClientesComponent,
          ),
      },
      {
        path: 'prestamos',
        loadComponent: () =>
          import('./features/admin/prestamos/prestamos.component').then(
            (m) => m.PrestamosComponent,
          ),
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/admin/pagos/pagos.component').then(
            (m) => m.PagosComponent,
          ),
      },
      {
        path: 'caja',
        loadComponent: () =>
          import('./features/admin/caja/caja.component').then(
            (m) => m.CajaComponent,
          ),
      },
      {
        path: 'mora',
        loadComponent: () =>
          import('./features/admin/mora/mora.component').then(
            (m) => m.MoraComponent,
          ),
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./features/admin/auditoria/auditoria.component').then(
            (m) => m.AuditoriaComponent,
          ),
      },
      { path: 'configuracion', loadComponent: placeholder },
    ],
  },
  {
    path: 'trabajador',
    canActivate: [authGuard],
    data: { roles: ['TRABAJADOR'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ruta' },
      {
        path: 'ruta',
        loadComponent: () =>
          import('./features/trabajador/ruta-diaria/ruta-diaria.component').then(
            (m) => m.RutaDiariaComponent,
          ),
      },
      {
        path: 'caja',
        loadComponent: () =>
          import('./features/trabajador/caja-trabajador/caja-trabajador.component').then(
            (m) => m.CajaTrabajadorComponent,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
