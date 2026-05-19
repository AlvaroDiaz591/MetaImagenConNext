export type AppointmentMode = "clinic" | "home";

export type RouteAlgorithm = "dijkstra" | "a_estrella";

export type PatientAgendaProfile = {
  id: number;
  usuarioId: number;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  telefono: string | null;
  email: string | null;
  codigoPaciente: string | null;
  estado: string | null;
};

export type PatientAgendaBranch = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  activo: boolean;
};

export type HomeVisitLimit = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  polygon: Array<{ lat: number; lng: number }>;
  color: string;
  activo: boolean;
  updatedAt: string | null;
};

export type AgendaService = {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  segmento: string;
  precio: number | null;
  duracionMinutos: number | null;
  imagen: string | null;
  video: string | null;
  tags: string[];
  beneficios: string[];
  disponibleEnClinica: boolean;
  disponibleADomicilio: boolean;
};

export type PatientAppointmentSummary = {
  id: number;
  pacienteId: number | null;
  personalId: number | null;
  scheduledAt: string | null;
  tipo: string;
  estado: string;
  notas: string | null;
  personalNombre: string | null;
  esDomicilio: boolean;
  duracionMinutos: number;
  domicilioLatitud: number | null;
  domicilioLongitud: number | null;
  domicilioDireccion: string | null;
  domicilioReferencia: string | null;
};

export type AppointmentSlot = {
  time: string;
  startsAt: string;
  available: boolean;
  remaining: number;
};

export type SlotsResponse = {
  date: string;
  mode: AppointmentMode;
  slots: AppointmentSlot[];
};

export type PatientAgendaBootstrap = {
  mensaje: string;
  paciente: PatientAgendaProfile;
  sucursales: PatientAgendaBranch[];
  limiteDomicilio: HomeVisitLimit | null;
  servicios: AgendaService[];
  citas: PatientAppointmentSummary[];
};

export type AppointmentCreateRequest = {
  scheduledAt: string;
  mode: AppointmentMode;
  tipo: string;
  notas: string | null;
  personalId?: number | null;
  sucursalNombre?: string | null;
  domicilioLatitud?: number | null;
  domicilioLongitud?: number | null;
  domicilioDireccion?: string | null;
  domicilioReferencia?: string | null;
};

export type RoutePoint = {
  lat: number;
  lng: number;
};

export type RouteResult = {
  algoritmo: RouteAlgorithm;
  modo: "driving" | "walking";
  distanciaMetros: number;
  duracionSegundos: number;
  nodosVisitados: number;
  ruta: RoutePoint[];
  alternativas: number;
  fuente: string;
};

export type ReverseGeocodeResult = {
  direccion: string;
  latitud: number;
  longitud: number;
};
