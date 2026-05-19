"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useMemo, useState } from "react";
import styles from "../../styles/AdminDashboard.module.css";
import type { HomeVisitPoint, HomeVisitRoute } from "./AdminHomeVisitsMapClient";

type AdminHomeVisitsSectionProps = {
  filas: Array<Record<string, unknown>>;
  onViewRow: (row: Record<string, unknown>) => void;
};

type HomeVisitRecord = {
  id: number | null;
  pacienteNombre: string;
  pacienteTelefono: string;
  pacienteEmail: string;
  estado: string;
  scheduledAt: string;
  domicilioDireccion: string;
  domicilioReferencia: string;
  domicilioLatitud: number | null;
  domicilioLongitud: number | null;
  raw: Record<string, unknown>;
};

const FALLBACK_CENTER: [number, number] = [-17.7833, -63.1821];

const AdminHomeVisitsMapClient = dynamic(() => import("./AdminHomeVisitsMapClient"), {
  ssr: false,
  loading: () => <div className={styles.adminMapLoading}>Cargando mapa interactivo de visitas...</div>,
});

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ".").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toRecordId = (value: unknown): number | null => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Number.isFinite(parsed) ? parsed : null;
};

const toRouteGeoPoints = (value: unknown): Array<[number, number]> => {
  if (!value || typeof value !== "object") return [];

  const raw = (value as { geometry?: { coordinates?: unknown[] } }).geometry?.coordinates;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) return null;
      const lng = toNumber(pair[0]);
      const lat = toNumber(pair[1]);
      if (lat === null || lng === null) return null;
      return [lat, lng] as [number, number];
    })
    .filter((point): point is [number, number] => Boolean(point));
};

const getRouteDistance = (route: unknown): number => {
  if (!route || typeof route !== "object") return 0;
  const distance = toNumber((route as { distance?: unknown }).distance);
  return distance ?? 0;
};

const getRouteDuration = (route: unknown): number => {
  if (!route || typeof route !== "object") return 0;
  const duration = toNumber((route as { duration?: unknown }).duration);
  return duration ?? 0;
};

const normalizeVisits = (rows: Array<Record<string, unknown>>): HomeVisitRecord[] => {
  return rows.map((row) => {
    const fallbackPaciente = toRecordId(row.paciente_id);
    const pacienteNombre = normalizeText(row.paciente_nombre) || `Paciente #${fallbackPaciente ?? "N/D"}`;
    return {
      id: toRecordId(row.id),
      pacienteNombre,
      pacienteTelefono: normalizeText(row.paciente_telefono),
      pacienteEmail: normalizeText(row.paciente_email),
      estado: normalizeText(row.estado) || "pendiente",
      scheduledAt: normalizeText(row.scheduled_at),
      domicilioDireccion: normalizeText(row.domicilio_direccion),
      domicilioReferencia: normalizeText(row.domicilio_referencia),
      domicilioLatitud: toNumber(row.domicilio_latitud),
      domicilioLongitud: toNumber(row.domicilio_longitud),
      raw: row,
    };
  });
};

const parseRoutesFromPayload = (payload: unknown): HomeVisitRoute[] => {
  if (!payload || typeof payload !== "object") return [];
  const routesRaw = (payload as { routes?: unknown[] }).routes;
  if (!Array.isArray(routesRaw)) return [];

  return routesRaw.slice(0, 2).reduce<HomeVisitRoute[]>((acc, route, index) => {
    const points = toRouteGeoPoints(route);
    if (points.length < 2) return acc;
    acc.push({
      points,
      distanceMeters: getRouteDistance(route),
      durationSeconds: getRouteDuration(route),
      primary: index === 0,
    });
    return acc;
  }, []);
};

const formatDateTime = (value: string): string => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClassName = (estado: string): string => {
  const normalized = estado.toLowerCase();
  if (normalized.includes("confirm")) return styles.adminStatusSuccess;
  if (normalized.includes("cancel")) return styles.adminStatusDanger;
  return styles.adminStatusPending;
};

const AdminHomeVisitsSection = ({ filas, onViewRow }: AdminHomeVisitsSectionProps) => {
  const visits = useMemo(() => normalizeVisits(filas), [filas]);
  const firstWithCoordinates = useMemo(
    () => visits.find((item) => item.domicilioLatitud !== null && item.domicilioLongitud !== null) ?? visits[0] ?? null,
    [visits],
  );

  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [originPoint, setOriginPoint] = useState<HomeVisitPoint | null>(null);
  const [routes, setRoutes] = useState<HomeVisitRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState("");

  const selectedVisit = useMemo(() => {
    if (!visits.length) return null;
    if (selectedVisitId !== null) {
      const found = visits.find((item) => item.id === selectedVisitId);
      if (found) return found;
    }
    return firstWithCoordinates;
  }, [firstWithCoordinates, selectedVisitId, visits]);

  const destinationPoint = useMemo<HomeVisitPoint | null>(() => {
    if (!selectedVisit) return null;
    if (selectedVisit.domicilioLatitud === null || selectedVisit.domicilioLongitud === null) return null;
    return {
      lat: selectedVisit.domicilioLatitud,
      lng: selectedVisit.domicilioLongitud,
      label: selectedVisit.pacienteNombre,
    };
  }, [selectedVisit]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (destinationPoint) return [destinationPoint.lat, destinationPoint.lng];
    if (originPoint) return [originPoint.lat, originPoint.lng];
    return FALLBACK_CENTER;
  }, [destinationPoint, originPoint]);

  const recalculateRoutes = useCallback(async () => {
    if (!originPoint || !destinationPoint) {
      setRoutes([]);
      setRoutesError("Define un origen y selecciona una solicitud con coordenadas para calcular rutas.");
      return;
    }

    setRoutesLoading(true);
    setRoutesError("");

    try {
      const endpoint =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${originPoint.lng},${originPoint.lat};${destinationPoint.lng},${destinationPoint.lat}` +
        `?alternatives=true&geometries=geojson&overview=full`;

      const response = await fetch(endpoint, { method: "GET" });
      if (!response.ok) {
        throw new Error(`No fue posible obtener rutas (${response.status}).`);
      }

      const payload = (await response.json().catch(() => ({}))) as unknown;
      const parsedRoutes = parseRoutesFromPayload(payload);
      if (!parsedRoutes.length) {
        throw new Error("No se encontraron rutas entre la sucursal y el domicilio seleccionado.");
      }
      setRoutes(parsedRoutes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible calcular rutas.";
      setRoutes([]);
      setRoutesError(message);
    } finally {
      setRoutesLoading(false);
    }
  }, [destinationPoint, originPoint]);

  const requestCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !window.navigator.geolocation) {
      setRoutesError("Tu navegador no permite obtener la ubicación actual.");
      return;
    }

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        setOriginPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "Ubicación actual",
        });
        setRoutesError("");
      },
      (error) => {
        setRoutesError(`No se pudo obtener la ubicación actual (${error.message}).`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }, []);

  const onPickOrigin = useCallback((point: { lat: number; lng: number }) => {
    setOriginPoint({ lat: point.lat, lng: point.lng, label: "Origen manual" });
    setRoutesError("");
  }, []);

  if (!visits.length) {
    return <p className={styles.emptyText}>No hay solicitudes de visita a domicilio para mostrar.</p>;
  }

  return (
    <section className={styles.adminHomeVisitsLayout}>
      <div className={styles.adminHomeVisitsList}>
        <h3>Solicitudes a domicilio</h3>
        <p>Selecciona un caso para visualizar y trazar rutas en dos colores.</p>

        <div className={styles.adminHomeVisitsCards}>
          {visits.map((visit) => {
            const isSelected = visit.id !== null && selectedVisit?.id === visit.id;
            return (
              <article
                key={`${visit.id ?? "sin-id"}-${visit.pacienteNombre}`}
                className={`${styles.adminHomeVisitCard} ${isSelected ? styles.adminHomeVisitCardSelected : ""}`}
                onClick={() => {
                  setSelectedVisitId(visit.id);
                  setRoutes([]);
                  setRoutesError("");
                }}
              >
                <div className={styles.adminHomeVisitCardHeader}>
                  <strong>{visit.pacienteNombre}</strong>
                  <span className={`${styles.adminStatusChip} ${getStatusClassName(visit.estado)}`}>{visit.estado || "pendiente"}</span>
                </div>

                <p>{visit.domicilioDireccion || "Sin direccion registrada"}</p>
                {visit.domicilioReferencia ? <small>Referencia: {visit.domicilioReferencia}</small> : null}
                <small>{formatDateTime(visit.scheduledAt)}</small>

                <div className={styles.adminHomeVisitCardActions}>
                  <button
                    type="button"
                    className={styles.actionButtonGhost}
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewRow(visit.raw);
                    }}
                  >
                    Ver detalle
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.adminHomeVisitsMapPane}>
        <div className={styles.adminHomeVisitsActions}>
          <button type="button" className={styles.actionButtonSoft} onClick={requestCurrentLocation}>
            Usar mi ubicación
          </button>
          <button type="button" className={styles.actionButtonEdit} onClick={recalculateRoutes} disabled={routesLoading}>
            {routesLoading ? "Calculando..." : "Recalcular rutas"}
          </button>
        </div>

        <AdminHomeVisitsMapClient
          center={mapCenter}
          origen={originPoint}
          destino={destinationPoint}
          rutas={routes}
          onPickOrigen={onPickOrigin}
        />

        {routesError ? <p className={styles.adminInlineError}>{routesError}</p> : null}
      </div>
    </section>
  );
};

export default memo(AdminHomeVisitsSection);
