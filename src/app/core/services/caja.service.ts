import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  AbrirCajaRequest,
  CajaDiaria,
  CajaRow,
  CerrarCajaRequest,
  MovimientoCaja,
} from '../models/caja.model';
import { PageableRequest, SpringPage } from '../models/trabajador.model';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/caja`;

  /** Caja diaria del trabajador autenticado (HU-FE-011). */
  miCaja(fecha?: string): Observable<CajaDiaria> {
    const url = fecha ? `${this.baseUrl}/mi-caja?fecha=${fecha}` : `${this.baseUrl}/mi-caja`;
    return this.http
      .get<ApiResponse<CajaDiaria>>(url)
      .pipe(map((res) => res.data));
  }

  /** Caja diaria de un trabajador para una fecha. */
  porTrabajador(trabajadorId: number, fecha?: string): Observable<CajaDiaria> {
    const url = fecha
      ? `${this.baseUrl}/trabajador/${trabajadorId}?fecha=${fecha}`
      : `${this.baseUrl}/trabajador/${trabajadorId}`;
    return this.http
      .get<ApiResponse<CajaDiaria>>(url)
      .pipe(map((res) => res.data));
  }

  /** Listado paginado de cajas diarias de los trabajadores (HU-FE-020). */
  listar(request: PageableRequest): Observable<SpringPage<CajaRow>> {
    return this.http
      .post<ApiResponse<SpringPage<CajaRow>>>(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }

  /** Caja diaria por id. */
  obtener(cajaId: number): Observable<CajaDiaria> {
    return this.http
      .get<ApiResponse<CajaDiaria>>(`${this.baseUrl}/${cajaId}`)
      .pipe(map((res) => res.data));
  }

  abrir(dto: AbrirCajaRequest): Observable<CajaDiaria> {
    return this.http
      .post<ApiResponse<CajaDiaria>>(`${this.baseUrl}/abrir`, dto)
      .pipe(map((res) => res.data));
  }

  cerrar(dto: CerrarCajaRequest): Observable<CajaDiaria> {
    return this.http
      .post<ApiResponse<CajaDiaria>>(`${this.baseUrl}/cerrar`, dto)
      .pipe(map((res) => res.data));
  }

  /** Movimientos de una caja en orden cronológico (HU-BE-016). */
  movimientos(cajaId: number): Observable<MovimientoCaja[]> {
    return this.http
      .get<ApiResponse<MovimientoCaja[]>>(`${this.baseUrl}/${cajaId}/movimientos`)
      .pipe(map((res) => res.data));
  }
}
