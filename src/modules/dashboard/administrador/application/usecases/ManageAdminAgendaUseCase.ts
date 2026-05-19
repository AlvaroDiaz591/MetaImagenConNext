import type {
  AdminAgendaAppointment,
  AdminAgendaBootstrap,
  AdminAgendaListFilters,
  AgendaStatus,
  CreateAdminAgendaAppointmentInput,
  AdminAgendaPatient,
} from "../../domain/entities/AdminAgenda";
import type { AdminAgendaService } from "../../domain/services/AdminAgendaService";

export class ManageAdminAgendaUseCase {
  constructor(private readonly agendaService: AdminAgendaService) {}

  async obtenerBootstrap(token: string): Promise<AdminAgendaBootstrap> {
    this.assertToken(token);
    return this.agendaService.obtenerBootstrap(token);
  }

  async listarCitas(token: string, filters: AdminAgendaListFilters): Promise<AdminAgendaAppointment[]> {
    this.assertToken(token);
    return this.agendaService.listarCitas(token, filters);
  }

  async buscarPacientes(token: string, query: string): Promise<AdminAgendaPatient[]> {
    this.assertToken(token);
    return this.agendaService.buscarPacientes(token, query);
  }

  async crearCita(token: string, payload: CreateAdminAgendaAppointmentInput): Promise<AdminAgendaAppointment> {
    this.assertToken(token);
    return this.agendaService.crearCita(token, payload);
  }

  async actualizarEstado(token: string, citaId: number, estado: AgendaStatus): Promise<AdminAgendaAppointment> {
    this.assertToken(token);
    return this.agendaService.actualizarEstado(token, citaId, estado);
  }

  private assertToken(token: string): void {
    if (!token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
  }
}
