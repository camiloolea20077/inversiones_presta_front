import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { MoraRow, PageableRequest, SpringPage } from '../models/mora.model';

/** Reporte de clientes en mora (HU-FE-021). */
@Injectable({ providedIn: 'root' })
export class MoraService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mora`;

  /** Listado paginado de clientes en mora con filtros. */
  listar(request: PageableRequest): Observable<SpringPage<MoraRow>> {
    return this.http
      .post<ApiResponse<SpringPage<MoraRow>>>(`${this.baseUrl}/listar`, request)
      .pipe(map((res) => res.data));
  }
}
