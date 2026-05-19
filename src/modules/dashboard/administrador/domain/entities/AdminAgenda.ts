export type AgendaStatus = "pendiente" | "confirmada" | "cancelada";

export type AgendaTab = "agendar" | "pacientes" | "listado";

export type AgendaListRange = "hoy" | "semana" | "mes" | "personalizado";

export type AdminAgendaPatient = {
  id: number;
  fullName: string;
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  codigo?: string | null;
  telefono?: string | null;
  estado: string;
};

export type AdminAgendaStaff = {
  id: number;
  displayName: string;
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  rol: string;
  activo: boolean;
  estado: string;
};

export type AdminAgendaServiceItem = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria: string;
  precio?: number | null;
  duracionMinutos: number;
  imagen?: string | null;
  beneficios: string[];
  tags: string[];
  disponibleEnClinica: boolean;
  disponibleADomicilio: boolean;
};

export type AdminAgendaAssignedStaff = {
  personalId: number;
  displayName: string;
  rol: string;
  activo: boolean;
};

export type AdminAgendaAppointment = {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  pacienteApellido?: string | null;
  pacienteCodigo?: string | null;
  pacienteDisplay: string;
  personalId?: number | null;
  personalNombre?: string | null;
  scheduledAt: string;
  tipo: string;
  estado: AgendaStatus;
  notas?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  esDomicilio: boolean;
  duracionMinutos: number;
  domicilioLatitud?: number | null;
  domicilioLongitud?: number | null;
  domicilioDireccion?: string | null;
  domicilioReferencia?: string | null;
  personalAsignado: AdminAgendaAssignedStaff[];
};

export type AdminAgendaBootstrap = {
  resumen: {
    citasHoy: number;
    pendientesSemana: number;
    citasSemana: number;
  };
  filtros: {
    estados: AgendaStatus[];
    tiposPredefinidos: string[];
  };
  pacientes: AdminAgendaPatient[];
  personal: AdminAgendaStaff[];
  servicios: AdminAgendaServiceItem[];
  citas: AdminAgendaAppointment[];
};

export type AdminAgendaListFilters = {
  from?: string;
  to?: string;
  patientId?: number;
  status?: AgendaStatus | "";
};

export type AdminAgendaStaffInput = {
  personalId: number;
  rol?: string;
};

export type CreateAdminAgendaAppointmentInput = {
  pacienteId: number;
  scheduledAt: string;
  tipo: string;
  notas?: string;
  duracionMinutos?: number;
  esDomicilio?: boolean;
  domicilioLatitud?: number;
  domicilioLongitud?: number;
  domicilioDireccion?: string;
  domicilioReferencia?: string;
  personalAsignado: AdminAgendaStaffInput[];
};
