import { API_BASE_URL, DASHBOARD_API_URL } from "@/src/shared/config/api";
import type { PatientLandingCatalog, PatientLandingServiceItem } from "../../domain/entities/PatientLandingCatalog";
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
  servicios?: Array<Record<string, unknown>>;
};

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
      servicios: (payload.servicios || []).map((item) => normalizeService(item)),
    };
  }
}
