import { DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  AdminNotificationFilter,
  AdminNotificationItem,
  AdminNotificationsPage,
  AdminNotificationSummary,
} from "../../domain/entities/AdminNotification";
import type { AdminNotificationsService } from "../../domain/services/AdminNotificationsService";

type NotificationApiItem = {
  id?: number;
  cita_id?: number | null;
  paciente_id?: number | null;
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  es_domicilio?: boolean;
  fecha_cita?: string;
  created_at?: string;
  visto?: boolean;
  paciente_nombre?: string;
};

type NotificationsListApiResponse = {
  mensaje?: string;
  items?: NotificationApiItem[];
  paginacion?: {
    pagina?: number;
    por_pagina?: number;
    total?: number;
    tiene_siguiente?: boolean;
  };
  resumen?: {
    total?: number;
    no_leidas?: number;
    leidas?: number;
  };
  filtros?: {
    actual?: AdminNotificationFilter;
    disponibles?: AdminNotificationFilter[];
  };
};

type NotificationActionApiResponse = {
  mensaje?: string;
  notificacion?: NotificationApiItem;
  notificaciones_actualizadas?: number;
  resumen?: {
    total?: number;
    no_leidas?: number;
    leidas?: number;
  };
};

const mapSummary = (summary?: NotificationActionApiResponse["resumen"]): AdminNotificationSummary => ({
  total: summary?.total || 0,
  noLeidas: summary?.no_leidas || 0,
  leidas: summary?.leidas || 0,
});

const mapItem = (item?: NotificationApiItem): AdminNotificationItem => ({
  id: item?.id || 0,
  citaId: item?.cita_id ?? null,
  pacienteId: item?.paciente_id ?? null,
  titulo: item?.titulo || "Notificacion",
  descripcion: item?.descripcion || "",
  tipo: item?.tipo || "cita",
  esDomicilio: Boolean(item?.es_domicilio),
  fechaCita: item?.fecha_cita || new Date().toISOString(),
  createdAt: item?.created_at || new Date().toISOString(),
  visto: Boolean(item?.visto),
  pacienteNombre: item?.paciente_nombre || "",
});

export class AdminNotificationsApiAdapter implements AdminNotificationsService {
  async listar(params: {
    token: string;
    query: string;
    filter: AdminNotificationFilter;
    page: number;
    pageSize: number;
  }): Promise<AdminNotificationsPage> {
    const query = new URLSearchParams({
      q: params.query,
      filter: params.filter,
      page: String(params.page),
      page_size: String(params.pageSize),
    });

    let response: Response;
    try {
      response = await fetch(`${DASHBOARD_API_URL}/administrador/notificaciones/?${query.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
        cache: "no-store",
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as NotificationsListApiResponse;
    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible cargar las notificaciones.");
    }

    return {
      items: (payload.items || []).map(mapItem),
      paginacion: {
        pagina: payload.paginacion?.pagina || params.page,
        porPagina: payload.paginacion?.por_pagina || params.pageSize,
        total: payload.paginacion?.total || 0,
        tieneSiguiente: Boolean(payload.paginacion?.tiene_siguiente),
      },
      resumen: mapSummary(payload.resumen),
      filtros: {
        actual: payload.filtros?.actual || params.filter,
        disponibles: payload.filtros?.disponibles || ["todas", "no_leidas", "leidas"],
      },
    };
  }

  async marcarLeida(params: {
    token: string;
    notificationId: number;
  }): Promise<{
    mensaje: string;
    notificacion: AdminNotificationItem;
    resumen: AdminNotificationSummary;
  }> {
    let response: Response;
    try {
      response = await fetch(`${DASHBOARD_API_URL}/administrador/notificaciones/${params.notificationId}/leer/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as NotificationActionApiResponse;
    if (!response.ok || !payload.notificacion) {
      throw new Error(payload.mensaje || "No fue posible marcar la notificacion como leida.");
    }

    return {
      mensaje: payload.mensaje || "Notificacion marcada como leida.",
      notificacion: mapItem(payload.notificacion),
      resumen: mapSummary(payload.resumen),
    };
  }

  async marcarTodasLeidas(params: { token: string }): Promise<{
    mensaje: string;
    notificacionesActualizadas: number;
    resumen: AdminNotificationSummary;
  }> {
    let response: Response;
    try {
      response = await fetch(`${DASHBOARD_API_URL}/administrador/notificaciones/leer-todas/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as NotificationActionApiResponse;
    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible marcar las notificaciones como leidas.");
    }

    return {
      mensaje: payload.mensaje || "Todas las notificaciones fueron marcadas como leidas.",
      notificacionesActualizadas: payload.notificaciones_actualizadas || 0,
      resumen: mapSummary(payload.resumen),
    };
  }
}
