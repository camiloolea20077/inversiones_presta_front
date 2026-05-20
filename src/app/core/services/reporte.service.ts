import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Rentabilidad } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  rentabilidad(fechaCorte?: string): Observable<Rentabilidad> {
    let params = new HttpParams();
    if (fechaCorte) {
      params = params.set('fechaCorte', fechaCorte);
    }
    return this.http
      .get<ApiResponse<Rentabilidad>>(`${this.baseUrl}/rentabilidad`, { params })
      .pipe(map((res) => res.data));
  }
}
