import { DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  AdminHomeVisitLimit,
  AdminHomeVisitLimitPayload,
  AdminLocationBranch,
  AdminLocationBranchPayload,
  AdminLocationDayKey,
  AdminLocationDaySchedule,
  AdminLocationScheduleByDay,
  AdminLocationsBootstrap,
} from "../../domain/entities/AdminLocation";
import type { AdminLocationsAuthParams, AdminLocationsService } from "../../domain/services/AdminLocationsService";

const DAY_KEYS: AdminLocationDayKey[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const DEFAULT_DAY_SCHEDULE: AdminLocationDaySchedule = {
  activo: true,
  mananaInicio: "08:30",
  mananaFin: "12:30",
  segundoTurnoActivo: true,
  segundoTurnoTipo: "tarde",
  segundoTurnoInicio: "14:30",
  segundoTurnoFin: "18:30",
};

const toText = (value: unknown): string => String(value ?? "").trim();

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "si", "sí", "yes", "on", "activo", "activa"].includes(normalized)) return true;
    if (["0", "false", "no", "off", "inactivo", "inactive", "inactiva"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeTime = (value: unknown, fallback: string): string => {
  const raw = toText(value);
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
};

const buildDefaultSchedule = (): AdminLocationScheduleByDay => ({
  lunes: { ...DEFAULT_DAY_SCHEDULE },
  martes: { ...DEFAULT_DAY_SCHEDULE },
  miercoles: { ...DEFAULT_DAY_SCHEDULE },
  jueves: { ...DEFAULT_DAY_SCHEDULE },
  viernes: { ...DEFAULT_DAY_SCHEDULE },
  sabado: { ...DEFAULT_DAY_SCHEDULE, mananaFin: "12:00", segundoTurnoFin: "16:00" },
  domingo: { ...DEFAULT_DAY_SCHEDULE, activo: false, segundoTurnoActivo: false },
});

const parseSchedule = (value: unknown): AdminLocationScheduleByDay => {
  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value || "{}");
    } catch {
      raw = {};
    }
  }

  const base = buildDefaultSchedule();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;

  const container = raw as Record<string, unknown>;
  const source = (container.dias && typeof container.dias === "object" && !Array.isArray(container.dias)
    ? container.dias
    : container) as Record<string, unknown>;

  for (const day of DAY_KEYS) {
    const current = source[day];
    if (!current || typeof current !== "object" || Array.isArray(current)) continue;
    const dayValue = current as Record<string, unknown>;
    const legacyManana = dayValue.manana && typeof dayValue.manana === "object" ? (dayValue.manana as Record<string, unknown>) : null;
    const legacySegundo =
      dayValue.segundo_turno && typeof dayValue.segundo_turno === "object"
        ? (dayValue.segundo_turno as Record<string, unknown>)
        : null;

    base[day] = {
      activo: dayValue.activo !== undefined ? toBool(dayValue.activo, base[day].activo) : toBool(dayValue.enabled, base[day].activo),
      mananaInicio: normalizeTime(dayValue.mananaInicio ?? dayValue.manana_inicio ?? legacyManana?.inicio ?? dayValue.from, base[day].mananaInicio),
      mananaFin: normalizeTime(dayValue.mananaFin ?? dayValue.manana_fin ?? legacyManana?.fin ?? dayValue.to, base[day].mananaFin),
      segundoTurnoActivo: toBool(
        dayValue.segundoTurnoActivo ?? dayValue.segundo_turno_activo ?? legacySegundo?.activo,
        base[day].segundoTurnoActivo,
      ),
      segundoTurnoTipo:
        toText(dayValue.segundoTurnoTipo ?? dayValue.segundo_turno_tipo ?? legacySegundo?.tipo) === "noche" ? "noche" : "tarde",
      segundoTurnoInicio: normalizeTime(
        dayValue.segundoTurnoInicio ?? dayValue.segundo_turno_inicio ?? legacySegundo?.inicio,
        base[day].segundoTurnoInicio,
      ),
      segundoTurnoFin: normalizeTime(
        dayValue.segundoTurnoFin ?? dayValue.segundo_turno_fin ?? legacySegundo?.fin,
        base[day].segundoTurnoFin,
      ),
    };
  }

  return base;
};

const parsePolygon = (value: unknown): Array<{ lat: number; lng: number }> => {
  const raw = typeof value === "string" ? JSON.parse(value || "[]") : value;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        const lat = toNumber(entry[0]);
        const lng = toNumber(entry[1]);
        return lat === null || lng === null ? null : { lat, lng };
      }
      if (!entry || typeof entry !== "object") return null;
      const point = entry as Record<string, unknown>;
      const lat = toNumber(point.lat ?? point.latitude);
      const lng = toNumber(point.lng ?? point.lon ?? point.longitude);
      return lat === null || lng === null ? null : { lat, lng };
    })
    .filter((entry): entry is { lat: number; lng: number } => Boolean(entry));
};

const authHeaders = (token: string): HeadersInit => ({ Authorization: `Bearer ${token}` });

const authJsonHeaders = (token: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const parseError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return toText(payload.mensaje) || toText(payload.error) || "No fue posible procesar la solicitud.";
};

const mapBranch = (payload: Record<string, unknown>): AdminLocationBranch => ({
  id: toNumber(payload.id),
  nombre: toText(payload.nombre) || "Sucursal",
  descripcion: toText(payload.descripcion) || null,
  direccion: toText(payload.direccion) || null,
  telefono: toText(payload.telefono) || null,
  whatsapp: toText(payload.whatsapp) || null,
  correo: toText(payload.correo) || null,
  horario: toText(payload.horario) || null,
  horarioDetalle: parseSchedule(payload.horario_detalle),
  latitud: toNumber(payload.latitud),
  longitud: toNumber(payload.longitud),
  instagramUrl: toText(payload.instagram_url) || null,
  facebookUrl: toText(payload.facebook_url) || null,
  tiktokUrl: toText(payload.tiktok_url) || null,
  imagenUrl: toText(payload.imagen_url) || null,
  imagenPath: toText(payload.imagen_path) || null,
  notas: toText(payload.notas) || null,
  activo: toBool(payload.activo, true),
  actualizadoEn: toText(payload.actualizado_en) || null,
});

const mapLimit = (payload: Record<string, unknown> | null): AdminHomeVisitLimit | null => {
  if (!payload || payload.mensaje) return null;

  return {
    id: toNumber(payload.id),
    nombre: toText(payload.nombre) || "Area habilitada",
    descripcion: toText(payload.descripcion) || null,
    color: toText(payload.color) || "#1de9b6",
    activo: toBool(payload.activo, true),
    polygon: parsePolygon(payload.polygon),
    updatedAt: toText(payload.updated_at) || null,
  };
};

const buildBranchPayload = (payload: AdminLocationBranchPayload): Record<string, unknown> => ({
  nombre: payload.nombre,
  descripcion: payload.descripcion,
  direccion: payload.direccion,
  telefono: payload.telefono,
  whatsapp: payload.whatsapp,
  correo: payload.correo,
  horario_detalle: payload.horarioDetalle,
  latitud: payload.latitud,
  longitud: payload.longitud,
  instagram_url: payload.instagramUrl,
  facebook_url: payload.facebookUrl,
  tiktok_url: payload.tiktokUrl,
  imagen_url: payload.imagenUrl,
  imagen_path: payload.imagenPath,
  notas: payload.notas,
  activo: payload.activo,
});

const buildLimitPayload = (payload: AdminHomeVisitLimitPayload): Record<string, unknown> => ({
  nombre: payload.nombre,
  descripcion: payload.descripcion,
  color: payload.color,
  activo: payload.activo,
  polygon: payload.polygon,
});

export class AdminLocationsApiAdapter implements AdminLocationsService {
  async obtenerBootstrap(params: AdminLocationsAuthParams): Promise<AdminLocationsBootstrap> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/ubicaciones/bootstrap/`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(await parseError(response));

    const payload = (await response.json()) as Record<string, unknown>;
    const sucursales = Array.isArray(payload.sucursales)
      ? payload.sucursales
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map(mapBranch)
      : [];

    const resumen = payload.resumen && typeof payload.resumen === "object" ? (payload.resumen as Record<string, unknown>) : {};

    return {
      mensaje: toText(payload.mensaje) || "Ubicaciones listas para administrar.",
      sucursales,
      limiteDomicilio: mapLimit((payload.limite_domicilio || null) as Record<string, unknown> | null),
      resumen: {
        total: toNumber(resumen.total) || sucursales.length,
        activas: toNumber(resumen.activas) || sucursales.filter((entry) => entry.activo).length,
      },
    };
  }

  async crearSucursal(params: AdminLocationsAuthParams & { payload: AdminLocationBranchPayload }): Promise<AdminLocationBranch> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/ubicaciones/sucursales/`, {
      method: "POST",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify(buildBranchPayload(params.payload)),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapBranch((await response.json()) as Record<string, unknown>);
  }

  async actualizarSucursal(
    params: AdminLocationsAuthParams & { sucursalId: number; payload: AdminLocationBranchPayload },
  ): Promise<AdminLocationBranch> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/ubicaciones/sucursales/${params.sucursalId}/`, {
      method: "PUT",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify(buildBranchPayload(params.payload)),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapBranch((await response.json()) as Record<string, unknown>);
  }

  async cambiarEstadoSucursal(
    params: AdminLocationsAuthParams & { sucursalId: number; activo: boolean },
  ): Promise<AdminLocationBranch> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/ubicaciones/sucursales/${params.sucursalId}/estado/`, {
      method: "PATCH",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify({ activo: params.activo }),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapBranch((await response.json()) as Record<string, unknown>);
  }

  async guardarLimiteDomicilio(
    params: AdminLocationsAuthParams & { payload: AdminHomeVisitLimitPayload },
  ): Promise<AdminHomeVisitLimit> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/ubicaciones/limite-domicilio/`, {
      method: "PUT",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify(buildLimitPayload(params.payload)),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapLimit((await response.json()) as Record<string, unknown>) as AdminHomeVisitLimit;
  }
}