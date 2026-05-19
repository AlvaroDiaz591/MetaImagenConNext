export type AdminNotificationFilter = "todas" | "no_leidas" | "leidas";

export type AdminNotificationSummary = {
  total: number;
  noLeidas: number;
  leidas: number;
};

export type AdminNotificationItem = {
  id: number;
  citaId: number | null;
  pacienteId: number | null;
  titulo: string;
  descripcion: string;
  tipo: string;
  esDomicilio: boolean;
  fechaCita: string;
  createdAt: string;
  visto: boolean;
  pacienteNombre: string;
};

export type AdminNotificationsPage = {
  items: AdminNotificationItem[];
  paginacion: {
    pagina: number;
    porPagina: number;
    total: number;
    tieneSiguiente: boolean;
  };
  resumen: AdminNotificationSummary;
  filtros: {
    actual: AdminNotificationFilter;
    disponibles: AdminNotificationFilter[];
  };
};
