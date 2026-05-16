import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/** Exige sesion activa y, opcionalmente, un rol concreto (route.data.roles). */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  const rolesPermitidos = route.data?.['roles'] as Rol[] | undefined;
  if (rolesPermitidos?.length && !rolesPermitidos.includes(auth.rol()!)) {
    return router.parseUrl(auth.rutaInicio());
  }

  return true;
};

/** Evita que un usuario autenticado vuelva a la pantalla de login. */
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.parseUrl(auth.rutaInicio()) : true;
};
