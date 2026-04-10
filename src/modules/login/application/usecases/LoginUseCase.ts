import { hasMinimumPasswordLength, isValidEmail } from "@/src/shared/utils/validators";
import type { AuthSession } from "../../domain/entities/AuthSession";
import type { LoginCredentials } from "../../domain/entities/LoginCredentials";
import type { LoginService } from "../../domain/services/LoginService";

export class LoginUseCase {
  constructor(private readonly loginService: LoginService) {}

  async execute(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.correoElectronico.trim() || !credentials.contrasena.trim()) {
      throw new Error("Completa correo electronico y contrasena para continuar.");
    }

    if (!isValidEmail(credentials.correoElectronico)) {
      throw new Error("Ingresa un correo electronico valido.");
    }

    if (!hasMinimumPasswordLength(credentials.contrasena, 7)) {
      throw new Error("La contrasena debe tener al menos 7 caracteres.");
    }

    return this.loginService.iniciarSesion(credentials);
  }
}
