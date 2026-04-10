import type { PatientLandingCatalog } from "../../domain/entities/PatientLandingCatalog";
import type {
  PatientLandingCatalogParams,
  PatientLandingCatalogService,
} from "../../domain/services/PatientLandingCatalogService";

export class GetPatientLandingCatalogUseCase {
  constructor(private readonly service: PatientLandingCatalogService) {}

  async execute(params: PatientLandingCatalogParams): Promise<PatientLandingCatalog> {
    if (!params.token.trim()) {
      throw new Error("No se encontro un token de sesion valido.");
    }

    return this.service.obtenerCatalogo(params);
  }
}
