import type { AppointmentMode, SlotsResponse } from "../../domain/entities/PatientAgenda";
import type { AgendaAuthParams, PatientAgendaService } from "../../domain/services/PatientAgendaService";

export class GetPatientAgendaSlotsUseCase {
  constructor(private readonly service: PatientAgendaService) {}

  async execute(params: AgendaAuthParams & { date: string; mode: AppointmentMode }): Promise<SlotsResponse> {
    if (!params.token.trim()) {
      throw new Error("No se encontro un token de sesion valido.");
    }
    if (!params.date.trim()) {
      throw new Error("Selecciona una fecha para consultar disponibilidad.");
    }
    return this.service.obtenerDisponibilidad(params);
  }
}
