import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  LimiteTrabajador,
  LimiteTrabajadorRequest,
  PageableRequest,
  SpringPage,
  Trabajador,
  TrabajadorComboDto,
  TrabajadorRequest,
  TrabajadorRow,
} from '../models/trabajador.model';

@Injectable({ providedIn: 'root' })
export class TrabajadorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trabajadores`;

  listar(request: PageableRequest): Observable<SpringPage<TrabajadorRow>> {
    return this.http
      .post<ApiResponse<SpringPage<TrabajadorRow>>>(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }

  listarActivos(): Observable<TrabajadorComboDto[]> {
    return this.http
      .get<ApiResponse<TrabajadorComboDto[]>>(`${this.baseUrl}/activos`)
      .pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Trabajador> {
    return this.http
      .get<ApiResponse<Trabajador>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(dto: TrabajadorRequest): Observable<Trabajador> {
    return this.http
      .post<ApiResponse<Trabajador>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }

  actualizar(id: number, dto: TrabajadorRequest): Observable<Trabajador> {
    return this.http
      .put<ApiResponse<Trabajador>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, activo: boolean): Observable<Trabajador> {
    return this.http
      .patch<ApiResponse<Trabajador>>(`${this.baseUrl}/${id}/estado`, { activo })
      .pipe(map((res) => res.data));
  }

  obtenerLimite(id: number): Observable<LimiteTrabajador | null> {
    return this.http
      .get<ApiResponse<LimiteTrabajador | null>>(`${this.baseUrl}/${id}/limites`)
      .pipe(map((res) => res.data));
  }

  guardarLimite(id: number, dto: LimiteTrabajadorRequest): Observable<LimiteTrabajador> {
    return this.http
      .post<ApiResponse<LimiteTrabajador>>(`${this.baseUrl}/${id}/limites`, dto)
      .pipe(map((res) => res.data));
  }
}
