export type AdminLocationDayKey = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export type AdminLocationSecondShiftType = "tarde" | "noche";

export type AdminLocationDaySchedule = {
  activo: boolean;
  mananaInicio: string;
  mananaFin: string;
  segundoTurnoActivo: boolean;
  segundoTurnoTipo: AdminLocationSecondShiftType;
  segundoTurnoInicio: string;
  segundoTurnoFin: string;
};

export type AdminLocationScheduleByDay = Record<AdminLocationDayKey, AdminLocationDaySchedule>;

export type AdminLocationBranch = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  horario: string | null;
  horarioDetalle: AdminLocationScheduleByDay;
  latitud: number | null;
  longitud: number | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  imagenUrl: string | null;
  imagenPath: string | null;
  notas: string | null;
  activo: boolean;
  actualizadoEn: string | null;
};

export type AdminHomeVisitLimit = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  polygon: Array<{ lat: number; lng: number }>;
  updatedAt: string | null;
};

export type AdminLocationsBootstrap = {
  mensaje: string;
  sucursales: AdminLocationBranch[];
  limiteDomicilio: AdminHomeVisitLimit | null;
  resumen: {
    total: number;
    activas: number;
  };
};

export type AdminLocationBranchPayload = {
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  horarioDetalle: AdminLocationScheduleByDay;
  latitud: number | null;
  longitud: number | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  imagenUrl: string | null;
  imagenPath: string | null;
  notas: string | null;
  activo: boolean;
};

export type AdminHomeVisitLimitPayload = {
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  polygon: Array<{ lat: number; lng: number }>;
};