import { isStrongPassword, isValidEmail } from "@/src/shared/utils/validators";
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

    if (!isStrongPassword(credentials.contrasena)) {
      throw new Error("La contrasena debe tener 8 caracteres, mayuscula, minuscula y caracter especial.");
    }

    return this.loginService.iniciarSesion(credentials);
  }
}
