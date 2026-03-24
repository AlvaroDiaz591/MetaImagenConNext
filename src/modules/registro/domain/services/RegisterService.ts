import type { RegisterData, RegisteredUser } from "../entities/RegisterData";

export interface RegisterService {
  registrar(data: RegisterData): Promise<RegisteredUser>;
}
