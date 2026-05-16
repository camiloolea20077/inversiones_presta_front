import { Injectable, signal } from '@angular/core';

/** Acción principal que cada página publica en la barra superior. */
export interface AccionTopbar {
  label: string;
  icon: string;
  run: () => void;
}

/**
 * Estado compartido del encabezado (topbar): título, subtítulo y acción
 * principal. Cada página lo configura en su ngOnInit.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly titulo = signal('Panel Administrativo');
  readonly subtitulo = signal('Resumen general del sistema al día de hoy');
  readonly accion = signal<AccionTopbar | null>(null);

  configurar(titulo: string, subtitulo: string, accion: AccionTopbar | null = null): void {
    this.titulo.set(titulo);
    this.subtitulo.set(subtitulo);
    this.accion.set(accion);
  }
}
