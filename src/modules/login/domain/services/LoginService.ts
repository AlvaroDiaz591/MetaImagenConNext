import type { AuthSession } from "../entities/AuthSession";
import type { LoginCredentials } from "../entities/LoginCredentials";

export interface LoginService {
  iniciarSesion(credentials: LoginCredentials): Promise<AuthSession>;
}
