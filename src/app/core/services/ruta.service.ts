import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageableRequest, SpringPage } from '../models/trabajador.model';
import { Ruta, RutaComboDto, RutaRequest, RutaRow } from '../models/ruta.model';
import { RutaClienteRow } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class RutaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/rutas`;

  listar(request: PageableRequest): Observable<SpringPage<RutaRow>> {
    return this.http
      .post<ApiResponse<SpringPage<RutaRow>>>(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Ruta> {
    return this.http
      .get<ApiResponse<Ruta>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(dto: RutaRequest): Observable<Ruta> {
    return this.http
      .post<ApiResponse<Ruta>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }

  actualizar(id: number, dto: RutaRequest): Observable<Ruta> {
    return this.http
      .put<ApiResponse<Ruta>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  listarActivas(): Observable<RutaComboDto[]> {
    return this.http
      .get<ApiResponse<RutaComboDto[]>>(`${this.baseUrl}/activas`)
      .pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, activo: boolean): Observable<Ruta> {
    return this.http
      .patch<ApiResponse<Ruta>>(`${this.baseUrl}/${id}/estado`, { activo })
      .pipe(map((res) => res.data));
  }

  asignarTrabajador(id: number, trabajadorId: number): Observable<Ruta> {
    return this.http
      .post<ApiResponse<Ruta>>(`${this.baseUrl}/${id}/asignar-trabajador`, { trabajadorId })
      .pipe(map((res) => res.data));
  }

  /* ===== Clientes en la ruta ===== */

  listarClientes(rutaId: number): Observable<RutaClienteRow[]> {
    return this.http
      .get<ApiResponse<RutaClienteRow[]>>(`${this.baseUrl}/${rutaId}/clientes`)
      .pipe(map((res) => res.data));
  }

  insertarCliente(
    rutaId: number,
    clienteId: number,
    ordenBase: number | null,
  ): Observable<RutaClienteRow[]> {
    return this.http
      .post<ApiResponse<RutaClienteRow[]>>(`${this.baseUrl}/${rutaId}/clientes`, {
        clienteId,
        ordenBase,
      })
      .pipe(map((res) => res.data));
  }

  reordenarClientes(rutaId: number, ordenIds: number[]): Observable<RutaClienteRow[]> {
    return this.http
      .put<ApiResponse<RutaClienteRow[]>>(
        `${this.baseUrl}/${rutaId}/clientes/reordenar`,
        { ordenIds },
      )
      .pipe(map((res) => res.data));
  }

  quitarCliente(rutaId: number, rutaClienteId: number): Observable<RutaClienteRow[]> {
    return this.http
      .delete<ApiResponse<RutaClienteRow[]>>(
        `${this.baseUrl}/${rutaId}/clientes/${rutaClienteId}`,
      )
      .pipe(map((res) => res.data));
  }
}
