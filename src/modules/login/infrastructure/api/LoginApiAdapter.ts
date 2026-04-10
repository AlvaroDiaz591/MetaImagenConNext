import type { AuthSession } from "../../domain/entities/AuthSession";
import type { LoginCredentials } from "../../domain/entities/LoginCredentials";
import type { LoginService } from "../../domain/services/LoginService";
import { AUTH_API_URL } from "@/src/shared/config/api";

type LoginApiResponse = {
  token?: string;
  usuario?: {
    nombre_visible?: string;
    rol?: string;
  };
  mensaje?: string;
};

export class LoginApiAdapter implements LoginService {
  async iniciarSesion(credentials: LoginCredentials): Promise<AuthSession> {
    let response: Response;

    try {
      response = await fetch(`${AUTH_API_URL}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo_electronico: credentials.correoElectronico,
          contrasena: credentials.contrasena,
          recordar: credentials.recordar,
        }),
        cache: "no-store",
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as LoginApiResponse;

    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible autenticar en este momento.");
    }

    if (!payload.token) {
      throw new Error("La respuesta del servidor no incluye token de sesion.");
    }

    if (typeof window !== "undefined") {
      const storage = credentials.recordar ? window.localStorage : window.sessionStorage;
      const rol = payload.usuario?.rol || "Paciente";
      storage.setItem("meta_imagen_token", payload.token);
      storage.setItem(
        "meta_imagen_usuario",
        payload.usuario?.nombre_visible || credentials.correoElectronico,
      );
      storage.setItem("meta_imagen_rol", rol);
    }

    return {
      token: payload.token,
      nombreVisible: payload.usuario?.nombre_visible || credentials.correoElectronico,
      rol: payload.usuario?.rol || "Paciente",
    };
  }
}
