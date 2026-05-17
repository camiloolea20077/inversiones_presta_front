import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { DashboardResumen } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  /** Indicadores generales del negocio (HU-BE-018). */
  resumen(fecha?: string): Observable<DashboardResumen> {
    const url = fecha ? `${this.baseUrl}/resumen?fecha=${fecha}` : `${this.baseUrl}/resumen`;
    return this.http
      .get<ApiResponse<DashboardResumen>>(url)
      .pipe(map((res) => res.data));
  }
}
