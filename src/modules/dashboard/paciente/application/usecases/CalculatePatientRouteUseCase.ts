import type { RouteAlgorithm, RouteResult } from "../../domain/entities/PatientAgenda";
import type { AgendaAuthParams, PatientAgendaService } from "../../domain/services/PatientAgendaService";

export class CalculatePatientRouteUseCase {
  constructor(private readonly service: PatientAgendaService) {}

  async execute(
    params: AgendaAuthParams & {
      origenLat: number;
      origenLng: number;
      destinoLat: number;
      destinoLng: number;
      algoritmo: RouteAlgorithm;
      modo: "driving" | "walking";
    },
  ): Promise<RouteResult> {
    if (!params.token.trim()) {
      throw new Error("No se encontro un token de sesion valido.");
    }
    return this.service.calcularRuta(params);
  }
}
