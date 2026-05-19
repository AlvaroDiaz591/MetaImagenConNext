import type { PatientAppointmentSummary } from "../../domain/entities/PatientAgenda";
import type { AgendaAuthParams, PatientAgendaService } from "../../domain/services/PatientAgendaService";

export class ListPatientAppointmentsUseCase {
  constructor(private readonly service: PatientAgendaService) {}

  async execute(
    params: AgendaAuthParams & {
      from?: string;
      to?: string;
      status?: string;
    },
  ): Promise<PatientAppointmentSummary[]> {
    if (!params.token.trim()) {
      throw new Error("No se encontro un token de sesion valido.");
    }
    return this.service.listarCitas(params);
  }
}
