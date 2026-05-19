import type { ReverseGeocodeResult } from "../../domain/entities/PatientAgenda";
import type { AgendaAuthParams, PatientAgendaService } from "../../domain/services/PatientAgendaService";

export class ReverseGeocodePatientPointUseCase {
  constructor(private readonly service: PatientAgendaService) {}

  async execute(params: AgendaAuthParams & { lat: number; lng: number }): Promise<ReverseGeocodeResult> {
    if (!params.token.trim()) {
      throw new Error("No se encontro un token de sesion valido.");
    }
    return this.service.geocodificarInverso(params);
  }
}
