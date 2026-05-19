import type {
  AdminNotificationFilter,
  AdminNotificationItem,
  AdminNotificationsPage,
  AdminNotificationSummary,
} from "../entities/AdminNotification";

export interface AdminNotificationsService {
  listar(params: {
    token: string;
    query: string;
    filter: AdminNotificationFilter;
    page: number;
    pageSize: number;
  }): Promise<AdminNotificationsPage>;

  marcarLeida(params: {
    token: string;
    notificationId: number;
  }): Promise<{
    mensaje: string;
    notificacion: AdminNotificationItem;
    resumen: AdminNotificationSummary;
  }>;

  marcarTodasLeidas(params: {
    token: string;
  }): Promise<{
    mensaje: string;
    notificacionesActualizadas: number;
    resumen: AdminNotificationSummary;
  }>;
}
