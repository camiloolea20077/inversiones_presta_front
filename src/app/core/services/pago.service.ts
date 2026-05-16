import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  MarcarNoPagoRequest,
  PagoResponse,
  RegistrarPagoRequest,
} from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/pagos`;

  registrarPago(dto: RegistrarPagoRequest): Observable<PagoResponse> {
    return this.http
      .post<ApiResponse<PagoResponse>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }

  marcarNoPago(dto: MarcarNoPagoRequest): Observable<PagoResponse> {
    return this.http
      .post<ApiResponse<PagoResponse>>(`${this.baseUrl}/no-pago`, dto)
      .pipe(map((res) => res.data));
  }
}
