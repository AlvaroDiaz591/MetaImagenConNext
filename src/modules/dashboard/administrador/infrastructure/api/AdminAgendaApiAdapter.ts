import { DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  AdminAgendaAppointment,
  AdminAgendaAssignedStaff,
  AdminAgendaBootstrap,
  AdminAgendaListFilters,
  AgendaStatus,
  CreateAdminAgendaAppointmentInput,
  AdminAgendaPatient,
  AdminAgendaServiceItem,
  AdminAgendaStaff,
} from "../../domain/entities/AdminAgenda";
import type { AdminAgendaService } from "../../domain/services/AdminAgendaService";

type AgendaBootstrapApiResponse = {
  resumen?: {
    citas_hoy?: number;
    pendientes_semana?: number;
    citas_semana?: number;
  };
  filtros?: {
    estados?: AgendaStatus[];
    tipos_predefinidos?: string[];
  };
  pacientes?: AgendaPatientApiResponse[];
  personal?: AgendaStaffApiResponse[];
  servicios?: AgendaServiceApiResponse[];
  citas?: AgendaAppointmentApiResponse[];
  mensaje?: string;
};

type AgendaPatientApiResponse = {
  id?: number;
  full_name?: string;
  nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  codigo?: string | null;
  telefono?: string | null;
  estado?: string;
};

type AgendaStaffApiResponse = {
  id?: number;
  display_name?: string;
  nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  rol?: string;
  activo?: boolean;
  estado?: string;
};

type AgendaServiceApiResponse = {
  id?: number;
  nombre?: string;
  descripcion?: string | null;
  categoria?: string;
  precio?: number | null;
  duracion_minutos?: number;
  imagen?: string | null;
  beneficios?: string[];
  tags?: string[];
  disponible_en_clinica?: boolean;
  disponible_a_domicilio?: boolean;
};

type AgendaAssignedStaffApiResponse = {
  personal_id?: number;
  display_name?: string;
  rol?: string;
  activo?: boolean;
};

type AgendaAppointmentApiResponse = {
  id?: number;
  paciente_id?: number;
  paciente_nombre?: string;
  paciente_apellido?: string | null;
  paciente_codigo?: string | null;
  paciente_display?: string;
  personal_id?: number | null;
  personal_nombre?: string | null;
  scheduled_at?: string;
  tipo?: string;
  estado?: AgendaStatus;
  notas?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  es_domicilio?: boolean;
  duracion_minutos?: number;
  domicilio_latitud?: number | null;
  domicilio_longitud?: number | null;
  domicilio_direccion?: string | null;
  domicilio_referencia?: string | null;
  personal_asignado?: AgendaAssignedStaffApiResponse[];
};

type ErrorResponse = {
  mensaje?: string;
};

const toError = async (response: Response, fallback: string): Promise<never> => {
  const payload = (await response.json().catch(() => ({}))) as ErrorResponse;
  throw new Error(payload.mensaje || fallback);
};

const mapPatient = (item: AgendaPatientApiResponse): AdminAgendaPatient => ({
  id: item.id || 0,
  fullName: item.full_name || "Paciente",
  nombre: item.nombre,
  apellidoPaterno: item.apellido_paterno,
  apellidoMaterno: item.apellido_materno,
  codigo: item.codigo,
  telefono: item.telefono,
  estado: item.estado || "activo",
});

const mapStaff = (item: AgendaStaffApiResponse): AdminAgendaStaff => ({
  id: item.id || 0,
  displayName: item.display_name || "Personal",
  nombre: item.nombre,
  apellidoPaterno: item.apellido_paterno,
  apellidoMaterno: item.apellido_materno,
  rol: item.rol || "personal",
  activo: item.activo !== false,
  estado: item.estado || "activo",
});

const mapService = (item: AgendaServiceApiResponse): AdminAgendaServiceItem => ({
  id: item.id || 0,
  nombre: item.nombre || "Servicio",
  descripcion: item.descripcion,
  categoria: item.categoria || "General",
  precio: item.precio ?? null,
  duracionMinutos: item.duracion_minutos || 60,
  imagen: item.imagen || null,
  beneficios: item.beneficios || [],
  tags: item.tags || [],
  disponibleEnClinica: item.disponible_en_clinica !== false,
  disponibleADomicilio: item.disponible_a_domicilio !== false,
});

const mapAssignedStaff = (item: AgendaAssignedStaffApiResponse): AdminAgendaAssignedStaff => ({
  personalId: item.personal_id || 0,
  displayName: item.display_name || "Personal",
  rol: item.rol || "personal",
  activo: item.activo !== false,
});

const mapAppointment = (item: AgendaAppointmentApiResponse): AdminAgendaAppointment => ({
  id: item.id || 0,
  pacienteId: item.paciente_id || 0,
  pacienteNombre: item.paciente_nombre || "Paciente",
  pacienteApellido: item.paciente_apellido,
  pacienteCodigo: item.paciente_codigo,
  pacienteDisplay: item.paciente_display || item.paciente_nombre || "Paciente",
  personalId: item.personal_id ?? null,
  personalNombre: item.personal_nombre ?? null,
  scheduledAt: item.scheduled_at || new Date().toISOString(),
  tipo: item.tipo || "consulta",
  estado: item.estado || "pendiente",
  notas: item.notas,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  esDomicilio: Boolean(item.es_domicilio),
  duracionMinutos: item.duracion_minutos || 60,
  domicilioLatitud: item.domicilio_latitud ?? null,
  domicilioLongitud: item.domicilio_longitud ?? null,
  domicilioDireccion: item.domicilio_direccion ?? null,
  domicilioReferencia: item.domicilio_referencia ?? null,
  personalAsignado: (item.personal_asignado || []).map(mapAssignedStaff),
});

export class AdminAgendaApiAdapter implements AdminAgendaService {
  async obtenerBootstrap(token: string): Promise<AdminAgendaBootstrap> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/agenda/bootstrap/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null);

    if (!response) {
      throw new Error("No fue posible conectar con el servidor.");
    }
    if (!response.ok) {
      return toError(response, "No fue posible cargar la agenda administrativa.");
    }

    const payload = (await response.json()) as AgendaBootstrapApiResponse;
    return {
      resumen: {
        citasHoy: payload.resumen?.citas_hoy || 0,
        pendientesSemana: payload.resumen?.pendientes_semana || 0,
        citasSemana: payload.resumen?.citas_semana || 0,
      },
      filtros: {
        estados: payload.filtros?.estados || ["pendiente", "confirmada", "cancelada"],
        tiposPredefinidos: payload.filtros?.tipos_predefinidos || [],
      },
      pacientes: (payload.pacientes || []).map(mapPatient),
      personal: (payload.personal || []).map(mapStaff),
      servicios: (payload.servicios || []).map(mapService),
      citas: (payload.citas || []).map(mapAppointment),
    };
  }

  async listarCitas(token: string, filters: AdminAgendaListFilters): Promise<AdminAgendaAppointment[]> {
    const query = new URLSearchParams();
    if (filters.from) query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);
    if (filters.patientId) query.set("patientId", String(filters.patientId));
    if (filters.status) query.set("status", filters.status);

    const response = await fetch(`${DASHBOARD_API_URL}/administrador/agenda/citas/?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null);

    if (!response) {
      throw new Error("No fue posible conectar con el servidor.");
    }
    if (!response.ok) {
      return toError(response, "No fue posible cargar las citas.");
    }

    const payload = (await response.json()) as AgendaAppointmentApiResponse[];
    return payload.map(mapAppointment);
  }

  async buscarPacientes(token: string, query: string): Promise<AdminAgendaPatient[]> {
    const response = await fetch(
      `${DASHBOARD_API_URL}/administrador/agenda/pacientes/?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    ).catch(() => null);

    if (!response) {
      throw new Error("No fue posible conectar con el servidor.");
    }
    if (!response.ok) {
      return toError(response, "No fue posible buscar pacientes.");
    }

    const payload = (await response.json()) as AgendaPatientApiResponse[];
    return payload.map(mapPatient);
  }

  async crearCita(token: string, payload: CreateAdminAgendaAppointmentInput): Promise<AdminAgendaAppointment> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/agenda/citas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paciente_id: payload.pacienteId,
        scheduled_at: payload.scheduledAt,
        tipo: payload.tipo,
        notas: payload.notas,
        duracion_minutos: payload.duracionMinutos,
        es_domicilio: payload.esDomicilio,
        domicilio_latitud: payload.domicilioLatitud,
        domicilio_longitud: payload.domicilioLongitud,
        domicilio_direccion: payload.domicilioDireccion,
        domicilio_referencia: payload.domicilioReferencia,
        personal_asignado: payload.personalAsignado.map((item) => ({
          personal_id: item.personalId,
          rol: item.rol,
        })),
      }),
    }).catch(() => null);

    if (!response) {
      throw new Error("No fue posible conectar con el servidor.");
    }
    if (!response.ok) {
      return toError(response, "No fue posible agendar la cita.");
    }

    const data = (await response.json()) as AgendaAppointmentApiResponse;
    return mapAppointment(data);
  }

  async actualizarEstado(token: string, citaId: number, estado: AgendaStatus): Promise<AdminAgendaAppointment> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/agenda/citas/${citaId}/estado/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado }),
    }).catch(() => null);

    if (!response) {
      throw new Error("No fue posible conectar con el servidor.");
    }
    if (!response.ok) {
      return toError(response, "No fue posible actualizar la cita.");
    }

    const data = (await response.json()) as AgendaAppointmentApiResponse;
    return mapAppointment(data);
  }
}
