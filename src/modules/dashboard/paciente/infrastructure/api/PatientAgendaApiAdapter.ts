import { DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  AgendaService,
  AppointmentCreateRequest,
  AppointmentMode,
  HomeVisitLimit,
  PatientAgendaBootstrap,
  PatientAgendaBranch,
  PatientAgendaProfile,
  PatientAppointmentSummary,
  ReverseGeocodeResult,
  RouteResult,
  SlotsResponse,
} from "../../domain/entities/PatientAgenda";
import type { AgendaAuthParams, PatientAgendaService } from "../../domain/services/PatientAgendaService";

const toText = (value: unknown): string => String(value ?? "").trim();

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "si", "sí", "yes", "on", "activo"].includes(normalized)) return true;
    if (["0", "false", "no", "off", "inactivo"].includes(normalized)) return false;
  }
  return fallback;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => toText(entry)).filter(Boolean);
  }

  const raw = toText(value);
  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => toText(entry)).filter(Boolean);
      }
    } catch {
      // fallback a split
    }
  }

  return raw.split(/[\n,|;]/).map((entry) => entry.trim()).filter(Boolean);
};

const mapProfile = (payload: Record<string, unknown>): PatientAgendaProfile => ({
  id: toNumber(payload.id) || 0,
  usuarioId: toNumber(payload.usuario_id) || 0,
  nombre: toText(payload.nombre) || "Paciente",
  apellidoPaterno: toText(payload.apellido_paterno) || null,
  apellidoMaterno: toText(payload.apellido_materno) || null,
  telefono: toText(payload.telefono) || null,
  email: toText(payload.email) || null,
  codigoPaciente: toText(payload.codigo_paciente) || null,
  estado: toText(payload.estado) || null,
});

const mapBranch = (payload: Record<string, unknown>): PatientAgendaBranch => ({
  id: toNumber(payload.id),
  nombre: toText(payload.nombre) || "Sucursal",
  descripcion: toText(payload.descripcion) || null,
  direccion: toText(payload.direccion) || null,
  latitud: toNumber(payload.latitud),
  longitud: toNumber(payload.longitud),
  telefono: toText(payload.telefono) || null,
  whatsapp: toText(payload.whatsapp) || null,
  correo: toText(payload.correo) || null,
  activo: toBool(payload.activo, true),
});

const mapLimit = (payload: Record<string, unknown> | null): HomeVisitLimit | null => {
  if (!payload) return null;

  const polygon = Array.isArray(payload.polygon)
    ? payload.polygon
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({ lat: toNumber(entry.lat) || 0, lng: toNumber(entry.lng) || 0 }))
      .filter((entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lng))
    : [];

  return {
    id: toNumber(payload.id),
    nombre: toText(payload.nombre) || "Area habilitada",
    descripcion: toText(payload.descripcion) || null,
    polygon,
    color: toText(payload.color) || "#16c79a",
    activo: toBool(payload.activo, true),
    updatedAt: toText(payload.updated_at) || null,
  };
};

const mapService = (payload: Record<string, unknown>): AgendaService => ({
  id: toNumber(payload.id) || 0,
  nombre: toText(payload.nombre) || "Servicio",
  descripcion: toText(payload.descripcion) || "Servicio disponible en Meta Imagen.",
  categoria: toText(payload.categoria) || "General",
  segmento: toText(payload.segmento),
  precio: toNumber(payload.precio),
  duracionMinutos: toNumber(payload.duracion_minutos),
  imagen: toText(payload.imagen) || null,
  video: toText(payload.video) || null,
  tags: toStringList(payload.tags),
  beneficios: toStringList(payload.beneficios),
  disponibleEnClinica: toBool(payload.disponible_en_clinica, true),
  disponibleADomicilio: toBool(payload.disponible_a_domicilio, true),
});

const mapAppointment = (payload: Record<string, unknown>): PatientAppointmentSummary => ({
  id: toNumber(payload.id) || 0,
  pacienteId: toNumber(payload.paciente_id),
  personalId: toNumber(payload.personal_id),
  scheduledAt: toText(payload.scheduled_at) || null,
  tipo: toText(payload.tipo) || "consulta",
  estado: toText(payload.estado) || "pendiente",
  notas: toText(payload.notas) || null,
  personalNombre: toText(payload.personal_nombre) || null,
  esDomicilio: toBool(payload.es_domicilio, false),
  duracionMinutos: toNumber(payload.duracion_minutos) || 60,
  domicilioLatitud: toNumber(payload.domicilio_latitud),
  domicilioLongitud: toNumber(payload.domicilio_longitud),
  domicilioDireccion: toText(payload.domicilio_direccion) || null,
  domicilioReferencia: toText(payload.domicilio_referencia) || null,
});

const mapSlots = (payload: Record<string, unknown>): SlotsResponse => {
  const rawSlots = Array.isArray(payload.slots) ? payload.slots : [];

  return {
    date: toText(payload.date),
    mode: toText(payload.mode).includes("home") ? "home" : "clinic",
    slots: rawSlots
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        time: toText(entry.time),
        startsAt: toText(entry.startsAt),
        available: toBool(entry.available, false),
        remaining: toNumber(entry.remaining) || 0,
      })),
  };
};

const mapRoute = (payload: Record<string, unknown>): RouteResult => {
  const rawRoute = Array.isArray(payload.ruta) ? payload.ruta : [];

  return {
    algoritmo: toText(payload.algoritmo).includes("a") ? "a_estrella" : "dijkstra",
    modo: toText(payload.modo).includes("walk") ? "walking" : "driving",
    distanciaMetros: toNumber(payload.distancia_metros) || 0,
    duracionSegundos: toNumber(payload.duracion_segundos) || 0,
    nodosVisitados: toNumber(payload.nodos_visitados) || 0,
    ruta: rawRoute
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({ lat: toNumber(entry.lat) || 0, lng: toNumber(entry.lng) || 0 })),
    alternativas: toNumber(payload.alternativas) || 0,
    fuente: toText(payload.fuente) || "osrm",
  };
};

const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

const authJsonHeaders = (token: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const parseError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return toText(payload.mensaje) || toText(payload.error) || "No fue posible procesar la solicitud.";
};

const buildAppointmentPayload = (payload: AppointmentCreateRequest): Record<string, unknown> => {
  const base: Record<string, unknown> = {
    scheduled_at: payload.scheduledAt,
    es_domicilio: payload.mode === "home",
    tipo: payload.tipo,
    notas: payload.notas,
    personal_id: payload.personalId,
    sucursal_nombre: payload.sucursalNombre,
    domicilio_latitud: payload.domicilioLatitud,
    domicilio_longitud: payload.domicilioLongitud,
    domicilio_direccion: payload.domicilioDireccion,
    domicilio_referencia: payload.domicilioReferencia,
  };

  Object.keys(base).forEach((key) => {
    if (base[key] === undefined) {
      delete base[key];
    }
  });

  return base;
};

export class PatientAgendaApiAdapter implements PatientAgendaService {
  async obtenerBootstrap(params: AgendaAuthParams): Promise<PatientAgendaBootstrap> {
    const response = await fetch(`${DASHBOARD_API_URL}/paciente/agenda/bootstrap/`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const paciente = mapProfile((payload.paciente || {}) as Record<string, unknown>);
    const sucursales = Array.isArray(payload.sucursales)
      ? payload.sucursales
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map(mapBranch)
      : [];

    const servicios = Array.isArray(payload.servicios)
      ? payload.servicios
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map(mapService)
      : [];

    const citas = Array.isArray(payload.citas)
      ? payload.citas
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map(mapAppointment)
      : [];

    return {
      mensaje: toText(payload.mensaje) || "Agenda lista para paciente.",
      paciente,
      sucursales,
      limiteDomicilio: mapLimit((payload.limite_domicilio || null) as Record<string, unknown> | null),
      servicios,
      citas,
    };
  }

  async obtenerDisponibilidad(params: AgendaAuthParams & { date: string; mode: AppointmentMode }): Promise<SlotsResponse> {
    const query = new URLSearchParams({
      date: params.date,
      mode: params.mode,
    });

    const response = await fetch(`${DASHBOARD_API_URL}/paciente/agenda/disponibilidad/?${query.toString()}`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return mapSlots(payload);
  }

  async listarCitas(
    params: AgendaAuthParams & {
      from?: string;
      to?: string;
      status?: string;
    },
  ): Promise<PatientAppointmentSummary[]> {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.status) query.set("status", params.status);

    const response = await fetch(`${DASHBOARD_API_URL}/paciente/agenda/citas/?${query.toString()}`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) return [];

    return payload
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map(mapAppointment);
  }

  async crearCita(params: AgendaAuthParams & { payload: AppointmentCreateRequest }): Promise<PatientAppointmentSummary> {
    const response = await fetch(`${DASHBOARD_API_URL}/paciente/agenda/citas/`, {
      method: "POST",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify(buildAppointmentPayload(params.payload)),
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return mapAppointment(payload);
  }

  async calcularRuta(
    params: AgendaAuthParams & {
      origenLat: number;
      origenLng: number;
      destinoLat: number;
      destinoLng: number;
      algoritmo: "dijkstra" | "a_estrella";
      modo: "driving" | "walking";
    },
  ): Promise<RouteResult> {
    const query = new URLSearchParams({
      origen_lat: String(params.origenLat),
      origen_lng: String(params.origenLng),
      destino_lat: String(params.destinoLat),
      destino_lng: String(params.destinoLng),
      algoritmo: params.algoritmo,
      modo: params.modo,
    });

    const response = await fetch(`${DASHBOARD_API_URL}/paciente/agenda/ruta/?${query.toString()}`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return mapRoute(payload);
  }

  async geocodificarInverso(params: AgendaAuthParams & { lat: number; lng: number }): Promise<ReverseGeocodeResult> {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
    });

    const response = await fetch(`${DASHBOARD_API_URL}/paciente/agenda/geocodificar-inverso/?${query.toString()}`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return {
      direccion: toText(payload.direccion),
      latitud: toNumber(payload.latitud) || params.lat,
      longitud: toNumber(payload.longitud) || params.lng,
    };
  }
}
