import type { AdminPortalResponse, AdminRecordActionResponse } from "../../domain/entities/AdminDashboardSummary";
import type { AdminDashboardService } from "../../domain/services/AdminDashboardService";

export class GetAdminDashboardSummaryUseCase {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  async execute(params: {
    token: string;
    seccion: string;
    busqueda: string;
    pagina: number;
    porPagina: number;
  }): Promise<AdminPortalResponse> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }

    return this.dashboardService.obtenerPortal(params);
  }

  async actualizarRegistro(params: {
    token: string;
    seccion: string;
    recordId: number;
    payload: Record<string, unknown>;
  }): Promise<AdminRecordActionResponse> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    return this.dashboardService.actualizarRegistro(params);
  }

  async cambiarEstadoRegistro(params: {
    token: string;
    seccion: string;
    recordId: number;
  }): Promise<AdminRecordActionResponse> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    return this.dashboardService.cambiarEstadoRegistro(params);
  }

  async marcarNotificacionLeida(params: {
    token: string;
    recordId: number;
  }): Promise<AdminRecordActionResponse> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    return this.dashboardService.marcarNotificacionLeida(params);
  }

  async marcarTodasLasNotificacionesLeidas(params: {
    token: string;
  }): Promise<AdminRecordActionResponse> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    return this.dashboardService.marcarTodasLasNotificacionesLeidas(params);
  }
}