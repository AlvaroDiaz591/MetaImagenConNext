import { API_BASE_URL, DASHBOARD_API_URL } from "@/src/shared/config/api";
import type {
  AdminTreatmentCategory,
  AdminTreatmentItem,
  AdminTreatmentPayload,
  AdminTreatmentsBootstrap,
} from "../../domain/entities/AdminTreatment";
import type { AdminTreatmentsAuthParams, AdminTreatmentsService } from "../../domain/services/AdminTreatmentsService";

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
  const raw = toText(value).toLowerCase();
  if (["1", "true", "si", "sí", "yes", "on", "activo", "activa"].includes(raw)) return true;
  if (["0", "false", "no", "off", "inactivo", "inactive", "inactiva"].includes(raw)) return false;
  return fallback;
};

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((entry) => toText(entry)).filter(Boolean);
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
  return raw.split(/[\n,;|]+/).map((entry) => entry.trim()).filter(Boolean);
};

const resolveMediaUrl = (value: unknown): string | null => {
  const raw = toText(value);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("/")) return `${API_BASE_URL}${raw}`;
  return `${API_BASE_URL}/${raw}`;
};

const mapCategory = (value: unknown): AdminTreatmentCategory => (toText(value).toLowerCase() === "kinesiologia" ? "kinesiologia" : "estetica");

const authHeaders = (token: string): HeadersInit => ({ Authorization: `Bearer ${token}` });

const authJsonHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const parseError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return toText(payload.mensaje) || toText(payload.error) || "No fue posible procesar la solicitud.";
};

const mapItem = (payload: Record<string, unknown>): AdminTreatmentItem => ({
  id: toNumber(payload.id) || 0,
  nombre: toText(payload.nombre) || "Servicio",
  categoria: mapCategory(payload.categoria),
  segmento: toText(payload.segmento) || null,
  descripcion: toText(payload.descripcion) || null,
  beneficios: parseList(payload.beneficios),
  tags: parseList(payload.tags),
  precioDesde: toNumber(payload.precio_desde),
  precio: toNumber(payload.precio),
  duracionMinutos: toNumber(payload.duracion_minutos),
  destacado: toBool(payload.destacado, false),
  activo: toBool(payload.activo, true),
  estado: toText(payload.estado) || "activo",
  mostrarEnWeb: toBool(payload.mostrar_en_web, true),
  mostrarEnApp: toBool(payload.mostrar_en_app, true),
  disponibleEnClinica: toBool(payload.disponible_en_clinica, true),
  disponibleADomicilio: toBool(payload.disponible_a_domicilio, true),
  orden: toNumber(payload.orden) || 0,
  imagenUrl: resolveMediaUrl(payload.imagen_path),
  videoUrl: resolveMediaUrl(payload.video_path),
  creadoEn: toText(payload.creado_en) || null,
  actualizadoEn: toText(payload.actualizado_en) || null,
});

const buildPayload = (payload: AdminTreatmentPayload): Record<string, unknown> => ({
  nombre: payload.nombre,
  categoria: payload.categoria,
  segmento: payload.segmento,
  descripcion: payload.descripcion,
  beneficios: payload.beneficios,
  tags: payload.tags,
  precio_desde: payload.precioDesde,
  duracion_minutos: payload.duracionMinutos,
  destacado: payload.destacado,
  mostrar_en_web: payload.mostrarEnWeb,
  mostrar_en_app: payload.mostrarEnApp,
  disponible_en_clinica: payload.disponibleEnClinica,
  disponible_a_domicilio: payload.disponibleADomicilio,
  orden: payload.orden,
  activo: payload.activo,
  imagen_base64: payload.imagenBase64,
  remove_imagen: payload.removeImagen,
  video_base64: payload.videoBase64,
  remove_video: payload.removeVideo,
});

export class AdminTreatmentsApiAdapter implements AdminTreatmentsService {
  async obtenerBootstrap(params: AdminTreatmentsAuthParams): Promise<AdminTreatmentsBootstrap> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/tratamientos-servicios/bootstrap/`, {
      method: "GET",
      headers: authHeaders(params.token),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await parseError(response));

    const payload = (await response.json()) as Record<string, unknown>;
    const servicios = Array.isArray(payload.servicios)
      ? payload.servicios
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map(mapItem)
      : [];

    const categorias = Array.isArray(payload.categorias)
      ? payload.categorias.map((entry) => mapCategory(entry)).filter((value, index, arr) => arr.indexOf(value) === index)
      : [];

    const resumen = payload.resumen && typeof payload.resumen === "object" ? (payload.resumen as Record<string, unknown>) : {};

    return {
      mensaje: toText(payload.mensaje) || "Tratamientos y servicios listos para administrar.",
      servicios,
      categorias,
      resumen: {
        total: toNumber(resumen.total) || servicios.length,
        activos: toNumber(resumen.activos) || servicios.filter((item) => item.activo).length,
        destacados: toNumber(resumen.destacados) || servicios.filter((item) => item.destacado).length,
      },
    };
  }

  async crearServicio(params: AdminTreatmentsAuthParams & { payload: AdminTreatmentPayload }): Promise<AdminTreatmentItem> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/tratamientos-servicios/`, {
      method: "POST",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify(buildPayload(params.payload)),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapItem((await response.json()) as Record<string, unknown>);
  }

  async actualizarServicio(
    params: AdminTreatmentsAuthParams & { servicioId: number; payload: AdminTreatmentPayload },
  ): Promise<AdminTreatmentItem> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/tratamientos-servicios/${params.servicioId}/`, {
      method: "PUT",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify(buildPayload(params.payload)),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapItem((await response.json()) as Record<string, unknown>);
  }

  async cambiarEstadoServicio(
    params: AdminTreatmentsAuthParams & { servicioId: number; activo: boolean },
  ): Promise<AdminTreatmentItem> {
    const response = await fetch(`${DASHBOARD_API_URL}/administrador/tratamientos-servicios/${params.servicioId}/estado/`, {
      method: "PATCH",
      headers: authJsonHeaders(params.token),
      body: JSON.stringify({ activo: params.activo }),
    });
    if (!response.ok) throw new Error(await parseError(response));
    return mapItem((await response.json()) as Record<string, unknown>);
  }
}