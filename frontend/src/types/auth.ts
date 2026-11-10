export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSessionResponse {
  usuario: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface LoginPayload {
  email: string;
  senha: string;
}
