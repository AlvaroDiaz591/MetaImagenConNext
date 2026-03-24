import type { RegisterData, RegisteredUser } from "../../domain/entities/RegisterData";
import type { RegisterService } from "../../domain/services/RegisterService";

export class RegisterApiAdapter implements RegisterService {
  async registrar(data: RegisterData): Promise<RegisteredUser> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (data.correoElectronico.toLowerCase().startsWith("admin@")) {
      throw new Error("Ese correo no esta disponible.");
    }

    return {
      id: "user-demo-id",
      nombreVisible: data.nombreCompleto,
    };
  }
}
