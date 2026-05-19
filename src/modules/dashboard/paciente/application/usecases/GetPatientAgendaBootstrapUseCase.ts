import type { PatientAgendaBootstrap } from "../../domain/entities/PatientAgenda";
import type { AgendaAuthParams, PatientAgendaService } from "../../domain/services/PatientAgendaService";

export class GetPatientAgendaBootstrapUseCase {
  constructor(private readonly service: PatientAgendaService) {}

  async execute(params: AgendaAuthParams): Promise<PatientAgendaBootstrap> {
    if (!params.token.trim()) {
      throw new Error("No se encontro un token de sesion valido.");
    }
    return this.service.obtenerBootstrap(params);
  }
}
