import type { AuthSession } from "../../domain/entities/AuthSession";
import type { LoginCredentials } from "../../domain/entities/LoginCredentials";
import type { LoginService } from "../../domain/services/LoginService";

export class LoginApiAdapter implements LoginService {
  async iniciarSesion(credentials: LoginCredentials): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (credentials.correoElectronico.toLowerCase() === "error@demo.com") {
      throw new Error("No fue posible autenticar en este momento.");
    }

    return {
      token: "session-demo-token",
      nombreVisible: credentials.correoElectronico,
    };
  }
}
