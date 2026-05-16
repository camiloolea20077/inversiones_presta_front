export type Rol = 'ADMINISTRADOR' | 'TRABAJADOR';

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  error: boolean;
}

export interface LoginRequest {
  correo: string;
  password: string;
  rol?: Rol;
}

export interface LoginResponse {
  token: string;
  tipoToken: string;
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: Rol;
}

export interface UsuarioAutenticado {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: Rol;
}
