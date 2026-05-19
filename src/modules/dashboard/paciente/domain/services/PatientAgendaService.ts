import type {
  AppointmentCreateRequest,
  AppointmentMode,
  PatientAgendaBootstrap,
  PatientAppointmentSummary,
  ReverseGeocodeResult,
  RouteAlgorithm,
  RouteResult,
  SlotsResponse,
} from "../entities/PatientAgenda";

export type AgendaAuthParams = {
  token: string;
};

export interface PatientAgendaService {
  obtenerBootstrap(params: AgendaAuthParams): Promise<PatientAgendaBootstrap>;
  obtenerDisponibilidad(params: AgendaAuthParams & { date: string; mode: AppointmentMode }): Promise<SlotsResponse>;
  listarCitas(params: AgendaAuthParams & { from?: string; to?: string; status?: string }): Promise<PatientAppointmentSummary[]>;
  crearCita(params: AgendaAuthParams & { payload: AppointmentCreateRequest }): Promise<PatientAppointmentSummary>;
  calcularRuta(params: AgendaAuthParams & {
    origenLat: number;
    origenLng: number;
    destinoLat: number;
    destinoLng: number;
    algoritmo: RouteAlgorithm;
    modo: "driving" | "walking";
  }): Promise<RouteResult>;
  geocodificarInverso(params: AgendaAuthParams & { lat: number; lng: number }): Promise<ReverseGeocodeResult>;
}
