import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageableRequest, SpringPage } from '../models/trabajador.model';
import {
  Cliente,
  ClienteComboDto,
  ClienteRequest,
  ClienteRow,
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  listar(request: PageableRequest): Observable<SpringPage<ClienteRow>> {
    return this.http
      .post<ApiResponse<SpringPage<ClienteRow>>>(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Cliente> {
    return this.http
      .get<ApiResponse<Cliente>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(dto: ClienteRequest): Observable<Cliente> {
    return this.http
      .post<ApiResponse<Cliente>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }

  actualizar(id: number, dto: ClienteRequest): Observable<Cliente> {
    return this.http
      .put<ApiResponse<Cliente>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, estado: string): Observable<Cliente> {
    return this.http
      .patch<ApiResponse<Cliente>>(`${this.baseUrl}/${id}/estado`, { estado })
      .pipe(map((res) => res.data));
  }

  listarActivos(): Observable<ClienteComboDto[]> {
    return this.http
      .get<ApiResponse<ClienteComboDto[]>>(`${this.baseUrl}/activos`)
      .pipe(map((res) => res.data));
  }
}
