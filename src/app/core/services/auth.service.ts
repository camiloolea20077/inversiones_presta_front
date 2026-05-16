import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, Rol } from '../models/auth.model';

const TOKEN_KEY = 'cd_token';
const USER_KEY = 'cd_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _usuario = signal<LoginResponse | null>(this.leerUsuario());

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, request).pipe(
      map((res) => res.data),
      tap((data) => this.guardarSesion(data)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._usuario.set(null);
  }

  /** Ruta de inicio segun el rol del usuario autenticado. */
  rutaInicio(): string {
    return this.rol() === 'TRABAJADOR' ? '/trabajador' : '/admin';
  }

  private guardarSesion(data: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    this._token.set(data.token);
    this._usuario.set(data);
  }

  private leerUsuario(): LoginResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse) : null;
  }
}
