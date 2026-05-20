import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  AbrirPresupuestoRequest,
  MovimientoPresupuestoRequest,
  Presupuesto,
} from '../models/presupuesto.model';

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/presupuesto`;

  /** Presupuesto activo o null si aún no se ha abierto. */
  obtener(): Observable<Presupuesto | null> {
    return this.http
      .get<ApiResponse<Presupuesto | null>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  abrir(dto: AbrirPresupuestoRequest): Observable<Presupuesto> {
    return this.http
      .post<ApiResponse<Presupuesto>>(`${this.baseUrl}/abrir`, dto)
      .pipe(map((res) => res.data));
  }

  capitalizar(dto: MovimientoPresupuestoRequest): Observable<Presupuesto> {
    return this.http
      .post<ApiResponse<Presupuesto>>(`${this.baseUrl}/capitalizar`, dto)
      .pipe(map((res) => res.data));
  }

  retirar(dto: MovimientoPresupuestoRequest): Observable<Presupuesto> {
    return this.http
      .post<ApiResponse<Presupuesto>>(`${this.baseUrl}/retirar`, dto)
      .pipe(map((res) => res.data));
  }
}
