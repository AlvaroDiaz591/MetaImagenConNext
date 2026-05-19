import { API_BASE_URL, DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  PatientLandingBranch,
  PatientLandingCatalog,
  PatientLandingDayKey,
  PatientLandingDaySchedule,
  PatientLandingServiceItem,
} from "../../domain/entities/PatientLandingCatalog";
import type {
  PatientLandingCatalogParams,
  PatientLandingCatalogService,
} from "../../domain/services/PatientLandingCatalogService";

type PatientLandingApiResponse = {
  mensaje?: string;
  usuario?: {
    nombre_visible?: string;
    rol?: string;
  };
  sucursales?: Array<Record<string, unknown>>;
  servicios?: Array<Record<string, unknown>>;
};

const DAY_KEYS: PatientLandingDayKey[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean).slice(0, 8);
  }

  const raw = normalizeText(value);
  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeText(item)).filter(Boolean).slice(0, 8);
      }
    } catch {
      // Fallback a split por delimitadores.
    }
  }

  return raw
    .split(/[\n,|;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    if (["1", "true", "t", "si", "sí", "yes", "activo", "activa"].includes(raw)) return true;
    if (["0", "false", "f", "no", "inactivo", "inactiva"].includes(raw)) return false;
  }
  return fallback;
};

const toTime = (value: unknown, fallback: string): string => {
  const raw = normalizeText(value);
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
};

const pick = (source: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

const parseHorarioDetalle = (value: unknown): Partial<Record<PatientLandingDayKey, PatientLandingDaySchedule>> => {
  let source: unknown = value;
  if (typeof value === "string") {
    try {
      source = JSON.parse(value);
    } catch {
      source = {};
    }
  }

  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const root = source as Record<string, unknown>;
  const dayContainer =
    root.dias && typeof root.dias === "object" && !Array.isArray(root.dias)
      ? (root.dias as Record<string, unknown>)
      : root;

  const parsed: Partial<Record<PatientLandingDayKey, PatientLandingDaySchedule>> = {};
  for (const day of DAY_KEYS) {
    const rawDay = dayContainer[day];
    if (!rawDay || typeof rawDay !== "object" || Array.isArray(rawDay)) continue;

    const dayObj = rawDay as Record<string, unknown>;
    const legacyManana =
      dayObj.manana && typeof dayObj.manana === "object" && !Array.isArray(dayObj.manana)
        ? (dayObj.manana as Record<string, unknown>)
        : null;
    const legacySegundo =
      dayObj.segundo_turno && typeof dayObj.segundo_turno === "object" && !Array.isArray(dayObj.segundo_turno)
        ? (dayObj.segundo_turno as Record<string, unknown>)
        : null;

    const legacyFrom = pick(dayObj, ["from"]);
    const legacyTo = pick(dayObj, ["to"]);
    const mananaInicioRaw = pick(dayObj, ["mananaInicio", "manana_inicio"]) ?? legacyManana?.inicio ?? legacyFrom;
    const mananaFinRaw = pick(dayObj, ["mananaFin", "manana_fin"]) ?? legacyManana?.fin ?? legacyTo;
    const segundoInicioRaw = pick(dayObj, ["segundoTurnoInicio", "segundo_turno_inicio"]) ?? legacySegundo?.inicio;
    const segundoFinRaw = pick(dayObj, ["segundoTurnoFin", "segundo_turno_fin"]) ?? legacySegundo?.fin;

    const hasAnyShiftInfo = Boolean(mananaInicioRaw || mananaFinRaw || segundoInicioRaw || segundoFinRaw || legacyManana || legacySegundo || legacyFrom || legacyTo);
    const explicitActive = pick(dayObj, ["activo"]);
    const legacyEnabled = pick(dayObj, ["enabled"]);
    const explicitSecondActive = pick(dayObj, ["segundoTurnoActivo", "segundo_turno_activo"]);

    parsed[day] = {
      activo:
        explicitActive === undefined
          ? legacyEnabled === undefined
            ? hasAnyShiftInfo
            : toBool(legacyEnabled, hasAnyShiftInfo)
          : toBool(explicitActive, hasAnyShiftInfo),
      mananaInicio: toTime(mananaInicioRaw, "08:30"),
      mananaFin: toTime(mananaFinRaw, "12:30"),
      segundoTurnoActivo:
        explicitSecondActive === undefined
          ? Boolean(segundoInicioRaw || segundoFinRaw || legacySegundo)
          : toBool(explicitSecondActive, Boolean(segundoInicioRaw || segundoFinRaw || legacySegundo)),
      segundoTurnoTipo:
        normalizeText(pick(dayObj, ["segundoTurnoTipo", "segundo_turno_tipo"]) ?? legacySegundo?.tipo) === "noche"
          ? "noche"
          : "tarde",
      segundoTurnoInicio: toTime(segundoInicioRaw, "14:30"),
      segundoTurnoFin: toTime(segundoFinRaw, "18:30"),
    };
  }

  return parsed;
};

const resolveMediaUrl = (value: unknown): string | null => {
  const raw = normalizeText(value);
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${API_BASE_URL}${raw}`;
  }

  return `${API_BASE_URL}/${raw}`;
};

const getRecordId = (row: Record<string, unknown>): number | null => {
  const rawId = row.id;
  if (typeof rawId === "number" && Number.isFinite(rawId)) return rawId;
  if (typeof rawId === "string") {
    const parsed = Number(rawId);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeService = (row: Record<string, unknown>): PatientLandingServiceItem => ({
  id: getRecordId(row),
  nombre: normalizeText(row.nombre) || "Servicio",
  descripcion: normalizeText(row.descripcion) || "Servicio disponible en Meta Imagen.",
  categoria: normalizeText(row.categoria) || "General",
  segmento: normalizeText(row.segmento),
  precio: toNumber(row.precio),
  duracionMinutos: toNumber(row.duracion_minutos),
  imagenUrl: resolveMediaUrl(row.imagen),
  videoUrl: resolveMediaUrl(row.video),
  tags: parseList(row.tags),
  beneficios: parseList(row.beneficios),
});

const normalizeBranch = (row: Record<string, unknown>): PatientLandingBranch => ({
  id: getRecordId(row),
  nombre: normalizeText(row.nombre) || "Sucursal",
  descripcion: normalizeText(row.descripcion),
  direccion: normalizeText(row.direccion),
  latitud: toNumber(row.latitud),
  longitud: toNumber(row.longitud),
  telefono: normalizeText(row.telefono),
  whatsapp: normalizeText(row.whatsapp),
  correo: normalizeText(row.correo),
  instagramUrl: normalizeText(row.instagram_url),
  facebookUrl: normalizeText(row.facebook_url),
  tiktokUrl: normalizeText(row.tiktok_url),
  horario: normalizeText(row.horario),
  horarioDetalle: parseHorarioDetalle(row.horario_detalle),
  imagenUrl: resolveMediaUrl(row.imagen_url),
  imagenPath: resolveMediaUrl(row.imagen_path),
  notas: normalizeText(row.notas),
  activo: toBool(row.activo, true),
});

export class PatientLandingCatalogApiAdapter implements PatientLandingCatalogService {
  async obtenerCatalogo(params: PatientLandingCatalogParams): Promise<PatientLandingCatalog> {
    let response: Response;

    try {
      response = await fetch(`${DASHBOARD_API_URL}/paciente/catalogo/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
        cache: "no-store",
      });
    } catch {
      throw new Error("No fue posible conectar con el servidor.");
    }

    const payload = (await response.json().catch(() => ({}))) as PatientLandingApiResponse;

    if (!response.ok) {
      throw new Error(payload.mensaje || "No fue posible cargar la landing de paciente.");
    }

    return {
      nombreVisible: payload.usuario?.nombre_visible || "Paciente",
      rol: payload.usuario?.rol || "Paciente",
      sucursales: (payload.sucursales || []).map((item) => normalizeBranch(item)),
      servicios: (payload.servicios || []).map((item) => normalizeService(item)),
    };
  }
}
