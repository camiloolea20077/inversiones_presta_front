import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  AuditoriaRow,
  AuditoriaUsuario,
  PageableRequest,
  SpringPage,
} from '../models/auditoria.model';

/** Auditoría del sistema (HU-FE-022). */
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auditoria`;

  /** Listado paginado de eventos de auditoría con filtros. */
  listar(request: PageableRequest): Observable<SpringPage<AuditoriaRow>> {
    return this.http
      .post<
        ApiResponse<SpringPage<AuditoriaRow>>
      >(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }

  /** Usuarios con eventos de auditoría, para alimentar el filtro por usuario. */
  usuarios(): Observable<AuditoriaUsuario[]> {
    return this.http
      .get<ApiResponse<AuditoriaUsuario[]>>(`${this.baseUrl}/usuarios`)
      .pipe(map((res) => res.data));
  }
}
