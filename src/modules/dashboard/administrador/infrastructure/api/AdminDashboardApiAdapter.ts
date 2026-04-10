import { DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  AccesoReciente,
  AccionRapida,
  AdminDashboardSummary,
  AdminModuleDefinition,
  AdminPortalData,
  AdminPortalPagination,
  AdminPortalResponse,
  AdminRecordActionResponse,
  AdminPortalView,
  AdminKpi,
  UsuarioDashboard,
} from "../../domain/entities/AdminDashboardSummary";
import type { AdminDashboardService } from "../../domain/services/AdminDashboardService";

type DashboardApiResponse = {
  mensaje?: string;
  usuario?: {
    id?: number;
    nombre_visible?: string;
    correo_electronico?: string;
    rol?: string;
  };
  resumen?: {
    fecha_servidor?: string;
    notificaciones?: {
      total?: number;
      no_leidas?: number;
    };
    kpis?: Array<{
      id?: string;
      titulo?: string;
      valor?: number;
      descripcion?: string;
    }>;
    accesos_recientes?: Array<{
      id?: number;
      nombre?: string;
      correo_electronico?: string;
      fecha?: string;
      evento?: "inicio_sesion" | "registro";
      rol?: string;
    }>;
    acciones_rapidas?: Array<{
      id?: string;
      titulo?: string;
      descripcion?: string;
    }>;
  };
  portal?: {
    seccion_activa?: string;
    modulos?: Array<{
      id?: string;
      titulo?: string;
      icono?: string;
      color?: string;
      vista?: "tabla" | "metricas";
      total_registros?: number;
      habilitado?: boolean;
    }>;
    busqueda?: string;
    columnas?: string[];
    filas?: Array<Record<string, unknown>>;
    paginacion?: {
      pagina?: number;
      por_pagina?: number;
      total?: number;
      tiene_siguiente?: boolean;
    };
    vista?: {
      tipo?: "tabla" | "metricas";
      mensaje?: string;
    };
  };
};

type DashboardActionApiResponse = {
  mensaje?: string;
  codigo?: string;
  resultado?: Record<string, unknown>;
};

export class AdminDashboardApiAdapter implements AdminDashboardService {
  async obtenerPortal(params: {
    token: string;
    seccion: string;
    busqueda: string;
    pagina: number;
    porPagina: number;
  }): Promise<AdminPortalResponse> {
    let response: Response;

    const query = new URLSearchParams({
      seccion: params.seccion,
      q: params.busqueda,
      page: String(params.pagina),
      page_size: String(params.porPagina),
    });

    try {
      response = await fetch(`${DASHBOARD_API_URL}/administrador/portal/?${query.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
        cache: "no-store",
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as DashboardApiResponse;

    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible cargar el dashboard.");
    }

    const usuario: UsuarioDashboard = {
      id: payload.usuario?.id || 0,
      nombreVisible: payload.usuario?.nombre_visible || "Usuario",
      correoElectronico: payload.usuario?.correo_electronico || "",
      rol: payload.usuario?.rol || "Sin rol",
    };

    const summary: AdminDashboardSummary = {
      fechaServidor: payload.resumen?.fecha_servidor || new Date().toISOString(),
      notificaciones: {
        total: payload.resumen?.notificaciones?.total || 0,
        noLeidas: payload.resumen?.notificaciones?.no_leidas || 0,
      },
      kpis: (payload.resumen?.kpis || []).map((item) => ({
        id: item.id || "sin_id",
        titulo: item.titulo || "Sin titulo",
        valor: item.valor || 0,
        descripcion: item.descripcion || "",
      })) as AdminKpi[],
      accesosRecientes: (payload.resumen?.accesos_recientes || []).map((item) => ({
        id: item.id || 0,
        nombre: item.nombre || "Sin nombre",
        correoElectronico: item.correo_electronico || "",
        fecha: item.fecha || new Date().toISOString(),
        evento: item.evento || "registro",
        rol: item.rol || "Sin rol",
      })) as AccesoReciente[],
      accionesRapidas: (payload.resumen?.acciones_rapidas || []).map((item) => ({
        id: item.id || "sin_id",
        titulo: item.titulo || "Sin titulo",
        descripcion: item.descripcion || "",
      })) as AccionRapida[],
      usuario,
    };

    const modulos: AdminModuleDefinition[] = (payload.portal?.modulos || []).map((item) => ({
      id: item.id || "sin_id",
      titulo: item.titulo || "Sin titulo",
      icono: item.icono || "circle",
      color: item.color || "#10b981",
      vista: item.vista || "tabla",
      totalRegistros: item.total_registros || 0,
      habilitado: item.habilitado !== false,
    }));

    const paginacion: AdminPortalPagination = {
      pagina: payload.portal?.paginacion?.pagina || 1,
      porPagina: payload.portal?.paginacion?.por_pagina || 20,
      total: payload.portal?.paginacion?.total || 0,
      tieneSiguiente: Boolean(payload.portal?.paginacion?.tiene_siguiente),
    };

    const vista: AdminPortalView = {
      tipo: payload.portal?.vista?.tipo || "tabla",
      mensaje: payload.portal?.vista?.mensaje || "",
    };

    const portal: AdminPortalData = {
      seccionActiva: payload.portal?.seccion_activa || params.seccion,
      modulos,
      busqueda: payload.portal?.busqueda || "",
      columnas: payload.portal?.columnas || [],
      filas: payload.portal?.filas || [],
      paginacion,
      vista,
    };

    return {
      summary,
      portal,
    };
  }

  async actualizarRegistro(params: {
    token: string;
    seccion: string;
    recordId: number;
    payload: Record<string, unknown>;
  }): Promise<AdminRecordActionResponse> {
    return this.sendRecordAction({
      token: params.token,
      seccion: params.seccion,
      recordId: params.recordId,
      accion: "update",
      payload: params.payload,
    });
  }

  async cambiarEstadoRegistro(params: {
    token: string;
    seccion: string;
    recordId: number;
  }): Promise<AdminRecordActionResponse> {
    return this.sendRecordAction({
      token: params.token,
      seccion: params.seccion,
      recordId: params.recordId,
      accion: "toggle_active",
      payload: {},
    });
  }

  async marcarNotificacionLeida(params: {
    token: string;
    recordId: number;
  }): Promise<AdminRecordActionResponse> {
    return this.sendRecordAction({
      token: params.token,
      seccion: "notificaciones",
      recordId: params.recordId,
      accion: "mark_read",
      payload: {},
    });
  }

  async marcarTodasLasNotificacionesLeidas(params: {
    token: string;
  }): Promise<AdminRecordActionResponse> {
    return this.sendRecordAction({
      token: params.token,
      seccion: "notificaciones",
      recordId: null,
      accion: "mark_all_read",
      payload: {},
    });
  }

  private async sendRecordAction(params: {
    token: string;
    seccion: string;
    recordId: number | null;
    accion: "update" | "toggle_active" | "mark_read" | "mark_all_read";
    payload: Record<string, unknown>;
  }): Promise<AdminRecordActionResponse> {
    let response: Response;

    try {
      response = await fetch(`${DASHBOARD_API_URL}/administrador/portal/registro/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          seccion: params.seccion,
          record_id: params.recordId,
          accion: params.accion,
          payload: params.payload,
        }),
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as DashboardActionApiResponse;
    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible actualizar el registro.");
    }

    return {
      mensaje: payload.mensaje || "Operacion realizada correctamente.",
      resultado: payload.resultado || {},
    };
  }
}