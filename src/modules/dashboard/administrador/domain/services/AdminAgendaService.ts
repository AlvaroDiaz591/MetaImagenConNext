import type {
  AdminAgendaAppointment,
  AdminAgendaBootstrap,
  AdminAgendaListFilters,
  AgendaStatus,
  CreateAdminAgendaAppointmentInput,
  AdminAgendaPatient,
} from "../entities/AdminAgenda";

export interface AdminAgendaService {
  obtenerBootstrap(token: string): Promise<AdminAgendaBootstrap>;
  listarCitas(token: string, filters: AdminAgendaListFilters): Promise<AdminAgendaAppointment[]>;
  buscarPacientes(token: string, query: string): Promise<AdminAgendaPatient[]>;
  crearCita(token: string, payload: CreateAdminAgendaAppointmentInput): Promise<AdminAgendaAppointment>;
  actualizarEstado(token: string, citaId: number, estado: AgendaStatus): Promise<AdminAgendaAppointment>;
}
