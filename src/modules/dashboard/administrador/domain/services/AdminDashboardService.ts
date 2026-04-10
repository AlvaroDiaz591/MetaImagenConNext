import type { AdminPortalResponse, AdminRecordActionResponse } from "../entities/AdminDashboardSummary";

export interface AdminDashboardService {
  obtenerPortal(params: {
    token: string;
    seccion: string;
    busqueda: string;
    pagina: number;
    porPagina: number;
  }): Promise<AdminPortalResponse>;

  actualizarRegistro(params: {
    token: string;
    seccion: string;
    recordId: number;
    payload: Record<string, unknown>;
  }): Promise<AdminRecordActionResponse>;

  cambiarEstadoRegistro(params: {
    token: string;
    seccion: string;
    recordId: number;
  }): Promise<AdminRecordActionResponse>;

  marcarNotificacionLeida(params: {
    token: string;
    recordId: number;
  }): Promise<AdminRecordActionResponse>;

  marcarTodasLasNotificacionesLeidas(params: {
    token: string;
  }): Promise<AdminRecordActionResponse>;
}