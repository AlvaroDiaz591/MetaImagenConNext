import type { RegisterData, RegisteredUser } from "../../domain/entities/RegisterData";
import type { RegisterService } from "../../domain/services/RegisterService";
import { AUTH_API_URL } from "@/src/shared/config/api";

type RegisterApiResponse = {
  usuario?: {
    id?: string | number;
    nombre_visible?: string;
  };
  token?: string;
  mensaje?: string;
};

export class RegisterApiAdapter implements RegisterService {
  async registrar(data: RegisterData): Promise<RegisteredUser> {
    let response: Response;

    try {
      response = await fetch(`${AUTH_API_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_completo: data.nombreCompleto,
          apellido_paterno: data.apellidoPaterno,
          apellido_materno: data.apellidoMaterno,
          numero_contacto: data.numeroContacto,
          correo_electronico: data.correoElectronico,
          contrasena: data.contrasena,
          confirmar_contrasena: data.confirmarContrasena,
        }),
        cache: "no-store",
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as RegisterApiResponse;

    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible crear la cuenta.");
    }

    const userId = payload.usuario?.id;
    if (userId === undefined || userId === null) {
      throw new Error("La respuesta del servidor no incluye el id del usuario.");
    }

    return {
      id: String(userId),
      nombreVisible: payload.usuario?.nombre_visible || data.nombreCompleto,
    };
  }
}
