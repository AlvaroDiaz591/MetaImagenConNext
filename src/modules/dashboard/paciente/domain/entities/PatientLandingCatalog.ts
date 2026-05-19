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

export type PatientLandingDayKey =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type PatientLandingDaySchedule = {
  activo: boolean;
  mananaInicio: string;
  mananaFin: string;
  segundoTurnoActivo: boolean;
  segundoTurnoTipo: "tarde" | "noche";
  segundoTurnoInicio: string;
  segundoTurnoFin: string;
};

export type PatientLandingBranch = {
  id: number | null;
  nombre: string;
  descripcion: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  telefono: string;
  whatsapp: string;
  correo: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  horario: string;
  horarioDetalle: Partial<Record<PatientLandingDayKey, PatientLandingDaySchedule>>;
  imagenUrl: string | null;
  imagenPath: string | null;
  notas: string;
  activo: boolean;
};

export type PatientLandingCatalog = {
  nombreVisible: string;
  rol: string;
  sucursales: PatientLandingBranch[];
  servicios: PatientLandingServiceItem[];
};
