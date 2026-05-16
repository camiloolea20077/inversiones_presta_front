import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { RecaudoDiario } from '../models/recaudo.model';

@Injectable({ providedIn: 'root' })
export class RecaudoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/recaudos`;

  /** Ruta diaria del trabajador autenticado. */
  miRuta(fecha?: string): Observable<RecaudoDiario> {
    const url = fecha ? `${this.baseUrl}/mi-ruta?fecha=${fecha}` : `${this.baseUrl}/mi-ruta`;
    return this.http
      .get<ApiResponse<RecaudoDiario>>(url)
      .pipe(map((res) => res.data));
  }

  generar(rutaId: number, fecha?: string): Observable<RecaudoDiario> {
    return this.http
      .post<ApiResponse<RecaudoDiario>>(`${this.baseUrl}/generar`, { rutaId, fecha })
      .pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<RecaudoDiario> {
    return this.http
      .get<ApiResponse<RecaudoDiario>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
