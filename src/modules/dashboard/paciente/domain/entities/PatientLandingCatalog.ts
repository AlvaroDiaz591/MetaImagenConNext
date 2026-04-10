export type PatientLandingServiceItem = {
  id: number | null;
  nombre: string;
  descripcion: string;
  categoria: string;
  segmento: string;
  precio: number | null;
  duracionMinutos: number | null;
  imagenUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  beneficios: string[];
};

export type PatientLandingCatalog = {
  nombreVisible: string;
  rol: string;
  servicios: PatientLandingServiceItem[];
};
