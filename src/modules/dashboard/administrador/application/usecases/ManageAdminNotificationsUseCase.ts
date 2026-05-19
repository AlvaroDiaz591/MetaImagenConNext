import type {
  AdminNotificationFilter,
  AdminNotificationsPage,
  AdminNotificationSummary,
  AdminNotificationItem,
} from "../../domain/entities/AdminNotification";
import type { AdminNotificationsService } from "../../domain/services/AdminNotificationsService";

export class ManageAdminNotificationsUseCase {
  constructor(private readonly notificationsService: AdminNotificationsService) {}

  async listar(params: {
    token: string;
    query: string;
    filter: AdminNotificationFilter;
    page: number;
    pageSize: number;
  }): Promise<AdminNotificationsPage> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    return this.notificationsService.listar(params);
  }

  async marcarLeida(params: {
    token: string;
    notificationId: number;
  }): Promise<{
    mensaje: string;
    notificacion: AdminNotificationItem;
    resumen: AdminNotificationSummary;
  }> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    if (params.notificationId <= 0) {
      throw new Error("No se encontro el identificador de la notificacion.");
    }
    return this.notificationsService.marcarLeida(params);
  }

  async marcarTodasLeidas(params: { token: string }): Promise<{
    mensaje: string;
    notificacionesActualizadas: number;
    resumen: AdminNotificationSummary;
  }> {
    if (!params.token.trim()) {
      throw new Error("No hay sesion activa. Inicia sesion para continuar.");
    }
    return this.notificationsService.marcarTodasLeidas(params);
  }
}
