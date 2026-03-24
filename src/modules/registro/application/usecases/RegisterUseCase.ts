import {
  isStrongPassword,
  isValidBolivianPhone,
  isValidEmail,
} from "@/src/shared/utils/validators";
import type { RegisterData, RegisteredUser } from "../../domain/entities/RegisterData";
import type { RegisterService } from "../../domain/services/RegisterService";

export class RegisterUseCase {
  constructor(private readonly registerService: RegisterService) {}

  async execute(data: RegisterData): Promise<RegisteredUser> {
    if (!data.nombreCompleto.trim()) {
      throw new Error("El nombre completo es obligatorio.");
    }

    if (!data.apellidoPaterno.trim() && !data.apellidoMaterno.trim()) {
      throw new Error("Debes ingresar al menos un apellido: paterno o materno.");
    }

    if (!isValidBolivianPhone(data.numeroContacto)) {
      throw new Error("Ingresa un numero boliviano valido de 8 digitos para +591.");
    }

    if (!isValidEmail(data.correoElectronico)) {
      throw new Error("Ingresa un correo electronico valido.");
    }

    if (!isStrongPassword(data.contrasena)) {
      throw new Error("La contrasena debe tener 8 caracteres, mayuscula, minuscula y caracter especial.");
    }

    if (data.contrasena !== data.confirmarContrasena) {
      throw new Error("La confirmacion de contrasena no coincide.");
    }

    return this.registerService.registrar(data);
  }
}
