import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageableRequest, SpringPage } from '../models/trabajador.model';
import {
  ClienteConPrestamo,
  ClienteConPrestamoRequest,
  Prestamo,
  PrestamoRequest,
  PrestamoRow,
  Simulacion,
  SimulacionRequest,
} from '../models/prestamo.model';

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/prestamos`;

  listar(request: PageableRequest): Observable<SpringPage<PrestamoRow>> {
    return this.http
      .post<ApiResponse<SpringPage<PrestamoRow>>>(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Prestamo> {
    return this.http
      .get<ApiResponse<Prestamo>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(dto: PrestamoRequest): Observable<Prestamo> {
    return this.http
      .post<ApiResponse<Prestamo>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }

  simular(dto: SimulacionRequest): Observable<Simulacion> {
    return this.http
      .post<ApiResponse<Simulacion>>(`${this.baseUrl}/simular`, dto)
      .pipe(map((res) => res.data));
  }

  /** Crea cliente nuevo + préstamo en una sola operación transaccional. */
  crearClienteConPrestamo(dto: ClienteConPrestamoRequest): Observable<ClienteConPrestamo> {
    return this.http
      .post<ApiResponse<ClienteConPrestamo>>(`${this.baseUrl}/cliente-nuevo`, dto)
      .pipe(map((res) => res.data));
  }
}
