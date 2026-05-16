import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  readonly menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin/dashboard' },
    { label: 'Rutas', icon: 'pi pi-map', route: '/admin/rutas' },
    { label: 'Trabajadores', icon: 'pi pi-user', route: '/admin/trabajadores' },
    { label: 'Clientes', icon: 'pi pi-users', route: '/admin/clientes' },
    { label: 'Préstamos', icon: 'pi pi-dollar', route: '/admin/prestamos' },
    { label: 'Pagos', icon: 'pi pi-credit-card', route: '/admin/pagos' },
    { label: 'Caja Diaria', icon: 'pi pi-wallet', route: '/admin/caja' },
    { label: 'Mora', icon: 'pi pi-clock', route: '/admin/mora' },
    { label: 'Auditoría', icon: 'pi pi-file', route: '/admin/auditoria' },
    { label: 'Configuración', icon: 'pi pi-cog', route: '/admin/configuracion' },
  ];
}
