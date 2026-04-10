export type AdminKpi = {
  id: string;
  titulo: string;
  valor: number;
  descripcion: string;
};

export type AccesoReciente = {
  id: number;
  nombre: string;
  correoElectronico: string;
  fecha: string;
  evento: "inicio_sesion" | "registro";
  rol: string;
};

export type AccionRapida = {
  id: string;
  titulo: string;
  descripcion: string;
};

export type UsuarioDashboard = {
  id: number;
  nombreVisible: string;
  correoElectronico: string;
  rol: string;
};

export type AdminDashboardSummary = {
  fechaServidor: string;
  kpis: AdminKpi[];
  notificaciones: {
    total: number;
    noLeidas: number;
  };
  accesosRecientes: AccesoReciente[];
  accionesRapidas: AccionRapida[];
  usuario: UsuarioDashboard;
};

export type AdminModuleDefinition = {
  id: string;
  titulo: string;
  icono: string;
  color: string;
  vista: "tabla" | "metricas";
  totalRegistros: number;
  habilitado: boolean;
};

export type AdminPortalPagination = {
  pagina: number;
  porPagina: number;
  total: number;
  tieneSiguiente: boolean;
};

export type AdminPortalView = {
  tipo: "tabla" | "metricas";
  mensaje: string;
};

export type AdminPortalData = {
  seccionActiva: string;
  modulos: AdminModuleDefinition[];
  busqueda: string;
  columnas: string[];
  filas: Array<Record<string, unknown>>;
  paginacion: AdminPortalPagination;
  vista: AdminPortalView;
};

export type AdminPortalResponse = {
  summary: AdminDashboardSummary;
  portal: AdminPortalData;
};

export type AdminRecordActionResponse = {
  mensaje: string;
  resultado: Record<string, unknown>;
};