import type { PatientLandingCatalog } from "../entities/PatientLandingCatalog";

export type PatientLandingCatalogParams = {
  token: string;
};

export interface PatientLandingCatalogService {
  obtenerCatalogo(params: PatientLandingCatalogParams): Promise<PatientLandingCatalog>;
}
