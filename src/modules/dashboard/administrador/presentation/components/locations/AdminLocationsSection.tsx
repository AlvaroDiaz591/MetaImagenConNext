"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { memo, useCallback, useMemo, useState } from "react";
import type { AdminHomeVisitLimit, AdminLocationBranch } from "../../../domain/entities/AdminLocation";
import { useAdminLocationsModule } from "../../modules/ubicaciones/hooks/useAdminLocationsModule";
import styles from "../../styles/AdminDashboard.module.css";
import type { GeoPoint } from "./AdminLocationsMapClient";

type AdminLocationsSectionProps = {
  active: boolean;
  token: string;
  themeMode?: "dark" | "light";
};

type BranchRecord = {
  id: number | null;
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  correo: string;
  horario: string;
  horarioDetalle: BranchScheduleByDay;
  latitud: number | null;
  longitud: number | null;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  imagenUrl: string;
  imagenPath: string;
  notas: string;
  activo: boolean;
};

type HomeVisitLimitRecord = {
  id: number | null;
  nombre: string;
  descripcion: string;
  color: string;
  activo: boolean;
  polygon: GeoPoint[];
};

type BranchDraft = Omit<BranchRecord, "id" | "raw">;

type DayKey = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
type SecondShiftType = "tarde" | "noche";
type BranchDaySchedule = {
  activo: boolean;
  mananaInicio: string;
  mananaFin: string;
  segundoTurnoActivo: boolean;
  segundoTurnoTipo: SecondShiftType;
  segundoTurnoInicio: string;
  segundoTurnoFin: string;
};
type BranchScheduleByDay = Record<DayKey, BranchDaySchedule>;

const DAY_KEYS: DayKey[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DAY_LABELS: Record<DayKey, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
  domingo: "Domingo",
};

const DEFAULT_DAY_SCHEDULE: BranchDaySchedule = {
  activo: true,
  mananaInicio: "08:30",
  mananaFin: "12:30",
  segundoTurnoActivo: true,
  segundoTurnoTipo: "tarde",
  segundoTurnoInicio: "14:30",
  segundoTurnoFin: "18:30",
};

const normalizeTime = (value: unknown, fallback: string): string => {
  const raw = String(value ?? "").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
};

const buildDefaultSchedule = (): BranchScheduleByDay => ({
  lunes: { ...DEFAULT_DAY_SCHEDULE },
  martes: { ...DEFAULT_DAY_SCHEDULE },
  miercoles: { ...DEFAULT_DAY_SCHEDULE },
  jueves: { ...DEFAULT_DAY_SCHEDULE },
  viernes: { ...DEFAULT_DAY_SCHEDULE },
  sabado: { ...DEFAULT_DAY_SCHEDULE, mananaFin: "12:00", segundoTurnoFin: "16:00" },
  domingo: { ...DEFAULT_DAY_SCHEDULE, activo: false, segundoTurnoActivo: false },
});

const parseSchedule = (value: unknown): BranchScheduleByDay => {
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
    const legacyManana = dayValue.manana && typeof dayValue.manana === "object"
      ? (dayValue.manana as Record<string, unknown>)
      : null;
    const legacySegundo = dayValue.segundo_turno && typeof dayValue.segundo_turno === "object"
      ? (dayValue.segundo_turno as Record<string, unknown>)
      : null;
    const legacyFrom = dayValue.from;
    const legacyTo = dayValue.to;

    base[day] = {
      activo: dayValue.activo !== undefined ? toBoolean(dayValue.activo, base[day].activo) : toBoolean(dayValue.enabled, base[day].activo),
      mananaInicio: normalizeTime(dayValue.mananaInicio ?? legacyManana?.inicio ?? legacyFrom, base[day].mananaInicio),
      mananaFin: normalizeTime(dayValue.mananaFin ?? legacyManana?.fin ?? legacyTo, base[day].mananaFin),
      segundoTurnoActivo: toBoolean(dayValue.segundoTurnoActivo ?? legacySegundo?.activo, base[day].segundoTurnoActivo),
      segundoTurnoTipo: normalizeText(dayValue.segundoTurnoTipo ?? legacySegundo?.tipo) === "noche" ? "noche" : "tarde",
      segundoTurnoInicio: normalizeTime(dayValue.segundoTurnoInicio ?? legacySegundo?.inicio, base[day].segundoTurnoInicio),
      segundoTurnoFin: normalizeTime(dayValue.segundoTurnoFin ?? legacySegundo?.fin, base[day].segundoTurnoFin),
    };
  }

  return base;
};

const buildScheduleSummary = (value: BranchScheduleByDay): string => {
  const active = DAY_KEYS.filter((day) => value[day].activo);
  if (!active.length) return "Sin dias activos";

  return active
    .map((day) => {
      const config = value[day];
      const second = config.segundoTurnoActivo
        ? ` / ${config.segundoTurnoInicio}-${config.segundoTurnoFin} (${config.segundoTurnoTipo})`
        : "";
      return `${DAY_LABELS[day]} ${config.mananaInicio}-${config.mananaFin}${second}`;
    })
    .join(" | ");
};

const buildSocialHref = (value: string, kind: "instagram" | "facebook" | "tiktok" | "whatsapp"): string => {
  const raw = value.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  if (kind === "whatsapp") {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length >= 8) return `https://wa.me/${digits}`;
  }

  return `https://${raw}`;
};

const FALLBACK_CENTER: [number, number] = [-17.7833, -63.1821];

const AdminLocationsMapClient = dynamic(() => import("./AdminLocationsMapClient"), {
  ssr: false,
  loading: () => <div className={styles.adminMapLoading}>Cargando mapa de ubicaciones...</div>,
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

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim().toLowerCase();
  if (["1", "true", "t", "si", "sí", "yes", "activo", "activa"].includes(raw)) return true;
  if (["0", "false", "f", "no", "inactivo", "inactiva", "inactive"].includes(raw)) return false;
  return fallback;
};

const parsePolygon = (value: unknown): GeoPoint[] => {
  let base: unknown = value;
  if (typeof value === "string") {
    try {
      base = JSON.parse(value || "[]");
    } catch {
      base = [];
    }
  }
  if (!Array.isArray(base)) return [];

  return base
    .map((item) => {
      if (Array.isArray(item) && item.length >= 2) {
        const lat = toNumber(item[0]);
        const lng = toNumber(item[1]);
        if (lat === null || lng === null) return null;
        return { lat, lng };
      }

      if (item && typeof item === "object") {
        const raw = item as { lat?: unknown; lng?: unknown; lon?: unknown; latitude?: unknown; longitude?: unknown };
        const lat = toNumber(raw.lat ?? raw.latitude);
        const lng = toNumber(raw.lng ?? raw.lon ?? raw.longitude);
        if (lat === null || lng === null) return null;
        return { lat, lng };
      }

      return null;
    })
    .filter((point): point is GeoPoint => Boolean(point));
};

const toBranchRecord = (branch: AdminLocationBranch): BranchRecord => ({
  id: branch.id,
  nombre: branch.nombre,
  descripcion: normalizeText(branch.descripcion),
  direccion: normalizeText(branch.direccion),
  telefono: normalizeText(branch.telefono),
  whatsapp: normalizeText(branch.whatsapp),
  correo: normalizeText(branch.correo),
  horario: normalizeText(branch.horario),
  horarioDetalle: parseSchedule(branch.horarioDetalle),
  latitud: branch.latitud,
  longitud: branch.longitud,
  instagramUrl: normalizeText(branch.instagramUrl),
  facebookUrl: normalizeText(branch.facebookUrl),
  tiktokUrl: normalizeText(branch.tiktokUrl),
  imagenUrl: normalizeText(branch.imagenUrl),
  imagenPath: normalizeText(branch.imagenPath),
  notas: normalizeText(branch.notas),
  activo: branch.activo,
});

const toLimitRecord = (limit: AdminHomeVisitLimit): HomeVisitLimitRecord => ({
  id: limit.id,
  nombre: limit.nombre,
  descripcion: normalizeText(limit.descripcion),
  color: normalizeText(limit.color) || "#1de9b6",
  activo: limit.activo,
  polygon: parsePolygon(limit.polygon),
});

const buildDraftFromBranch = (branch: BranchRecord): BranchDraft => ({
  nombre: branch.nombre,
  descripcion: branch.descripcion,
  direccion: branch.direccion,
  telefono: branch.telefono,
  whatsapp: branch.whatsapp,
  correo: branch.correo,
  horario: branch.horario,
  horarioDetalle: branch.horarioDetalle,
  latitud: branch.latitud,
  longitud: branch.longitud,
  instagramUrl: branch.instagramUrl,
  facebookUrl: branch.facebookUrl,
  tiktokUrl: branch.tiktokUrl,
  imagenUrl: branch.imagenUrl,
  imagenPath: branch.imagenPath,
  notas: branch.notas,
  activo: branch.activo,
});

const buildEmptyBranchDraft = (): BranchDraft => ({
  nombre: "",
  descripcion: "",
  direccion: "",
  telefono: "",
  whatsapp: "",
  correo: "",
  horario: "",
  horarioDetalle: buildDefaultSchedule(),
  latitud: null,
  longitud: null,
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  imagenUrl: "",
  imagenPath: "",
  notas: "",
  activo: true,
});

const AdminLocationsSection = ({ active, token }: AdminLocationsSectionProps) => {
  const {
    branches: locationBranches,
    homeVisitLimit: homeVisitLimitData,
    summary,
    loading,
    refreshing,
    error: remoteError,
    savingBranchId,
    savingLimit,
    refresh,
    createBranch,
    updateBranch,
    toggleBranchStatus: persistBranchStatus,
    saveHomeVisitLimit: persistHomeVisitLimit,
  } = useAdminLocationsModule({ active, token });

  const branches = useMemo(() => locationBranches.map(toBranchRecord), [locationBranches]);
  const homeVisitLimit = useMemo(
    () => (homeVisitLimitData ? toLimitRecord(homeVisitLimitData) : null),
    [homeVisitLimitData],
  );

  const [activeTab, setActiveTab] = useState<"sucursal" | "geocerca">("sucursal");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchDraftId, setBranchDraftId] = useState<number | null>(null);
  const [branchDraft, setBranchDraft] = useState<BranchDraft | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  const [limitPolygonDraft, setLimitPolygonDraft] = useState<GeoPoint[] | null>(null);
  const [limitActiveDraft, setLimitActiveDraft] = useState<boolean | null>(null);
  const [limitNameDraft, setLimitNameDraft] = useState<string | null>(null);
  const [limitDescriptionDraft, setLimitDescriptionDraft] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const effectiveError = error || remoteError;

  const filteredBranches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return branches;

    return branches.filter((branch) =>
      [branch.nombre, branch.direccion, branch.telefono, branch.whatsapp, branch.correo]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [branches, searchTerm]);

  const selectedBranch = useMemo(() => {
    if (!branches.length) return null;
    if (selectedBranchId !== null) {
      const found = branches.find((branch) => branch.id === selectedBranchId);
      if (found) return found;
    }
    return branches[0] ?? null;
  }, [branches, selectedBranchId]);

  const effectiveBranchDraft = useMemo<BranchDraft | null>(() => {
    if (creatingBranch) return branchDraft ?? buildEmptyBranchDraft();
    if (!selectedBranch) return null;
    if (branchDraft && branchDraftId === selectedBranch.id) return branchDraft;
    return buildDraftFromBranch(selectedBranch);
  }, [branchDraft, branchDraftId, creatingBranch, selectedBranch]);

  const effectiveLimitPolygon = useMemo(
    () => limitPolygonDraft ?? homeVisitLimit?.polygon ?? [],
    [homeVisitLimit, limitPolygonDraft],
  );
  const effectiveLimitActive = useMemo(
    () => limitActiveDraft ?? homeVisitLimit?.activo ?? true,
    [homeVisitLimit, limitActiveDraft],
  );
  const effectiveLimitName = useMemo(
    () => limitNameDraft ?? homeVisitLimit?.nombre ?? "Área habilitada",
    [homeVisitLimit, limitNameDraft],
  );
  const effectiveLimitDescription = useMemo(
    () => limitDescriptionDraft ?? homeVisitLimit?.descripcion ?? "",
    [homeVisitLimit, limitDescriptionDraft],
  );
  const effectiveScheduleSummary = useMemo(
    () => (effectiveBranchDraft ? buildScheduleSummary(effectiveBranchDraft.horarioDetalle) : "Sin horario"),
    [effectiveBranchDraft],
  );
  const branchReferenceImage = useMemo(() => {
    if (!effectiveBranchDraft) return "";
    return effectiveBranchDraft.imagenUrl || effectiveBranchDraft.imagenPath || "";
  }, [effectiveBranchDraft]);

  const socialButtons = useMemo(() => {
    if (!effectiveBranchDraft) return [];
    return [
      {
        key: "instagram",
        icon: "/assets/social/instagram.svg",
        label: "Instagram",
        href: buildSocialHref(effectiveBranchDraft.instagramUrl, "instagram"),
      },
      {
        key: "facebook",
        icon: "/assets/social/facebook.svg",
        label: "Facebook",
        href: buildSocialHref(effectiveBranchDraft.facebookUrl, "facebook"),
      },
      {
        key: "tiktok",
        icon: "/assets/social/tiktok.svg",
        label: "TikTok",
        href: buildSocialHref(effectiveBranchDraft.tiktokUrl, "tiktok"),
      },
      {
        key: "whatsapp",
        icon: "/assets/social/whatsapp.svg",
        label: "WhatsApp",
        href: buildSocialHref(effectiveBranchDraft.whatsapp, "whatsapp"),
      },
    ];
  }, [effectiveBranchDraft]);

  const branchPoint = useMemo(() => {
    if (!effectiveBranchDraft) return null;
    if (effectiveBranchDraft.latitud === null || effectiveBranchDraft.longitud === null) return null;
    return {
      lat: effectiveBranchDraft.latitud,
      lng: effectiveBranchDraft.longitud,
      label: effectiveBranchDraft.nombre || "Sucursal",
    };
  }, [effectiveBranchDraft]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (branchPoint) return [branchPoint.lat, branchPoint.lng];
    if (effectiveLimitPolygon.length) {
      const first = effectiveLimitPolygon[0];
      return [first.lat, first.lng];
    }
    return FALLBACK_CENTER;
  }, [branchPoint, effectiveLimitPolygon]);

  const setBranchField = useCallback(
    <K extends keyof BranchDraft>(field: K, value: BranchDraft[K]) => {
      if (!effectiveBranchDraft) return;
      setBranchDraftId(creatingBranch ? null : (selectedBranch?.id ?? null));
      setBranchDraft({
        ...effectiveBranchDraft,
        [field]: value,
      });
      setMessage("");
      setError("");
    },
    [creatingBranch, effectiveBranchDraft, selectedBranch],
  );

  const saveBranch = useCallback(async () => {
    if (!effectiveBranchDraft) {
      setError("Completa los datos de la sucursal antes de guardar.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const payload = {
        nombre: effectiveBranchDraft.nombre,
        descripcion: effectiveBranchDraft.descripcion || null,
        direccion: effectiveBranchDraft.direccion || null,
        telefono: effectiveBranchDraft.telefono || null,
        whatsapp: effectiveBranchDraft.whatsapp || null,
        correo: effectiveBranchDraft.correo || null,
        horarioDetalle: effectiveBranchDraft.horarioDetalle,
        latitud: effectiveBranchDraft.latitud,
        longitud: effectiveBranchDraft.longitud,
        instagramUrl: effectiveBranchDraft.instagramUrl || null,
        facebookUrl: effectiveBranchDraft.facebookUrl || null,
        tiktokUrl: effectiveBranchDraft.tiktokUrl || null,
        imagenUrl: effectiveBranchDraft.imagenUrl || null,
        imagenPath: effectiveBranchDraft.imagenPath || null,
        notas: effectiveBranchDraft.notas || null,
        activo: effectiveBranchDraft.activo,
      };

      if (creatingBranch) {
        const created = toBranchRecord(await createBranch(payload));
        setCreatingBranch(false);
        setSelectedBranchId(created.id);
        setBranchDraftId(created.id);
        setBranchDraft(buildDraftFromBranch(created));
        setMessage("Sucursal creada correctamente.");
        return;
      }

      if (!selectedBranch || selectedBranch.id === null) {
        setError("Selecciona una sucursal válida para guardar cambios.");
        return;
      }

      if (!window.confirm("Vas a actualizar la sucursal seleccionada. ¿Deseas continuar?")) {
        return;
      }

      const updated = toBranchRecord(await updateBranch(selectedBranch.id, payload));
      setSelectedBranchId(updated.id);
      setBranchDraftId(updated.id);
      setBranchDraft(buildDraftFromBranch(updated));
      setMessage("Sucursal actualizada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la sucursal.");
    }
  }, [createBranch, creatingBranch, effectiveBranchDraft, selectedBranch, updateBranch]);

  const toggleBranchStatus = useCallback(
    async (branch: BranchRecord) => {
      if (branch.id === null) return;
      setError("");
      setMessage("");

      try {
        if (!window.confirm(`La sucursal quedará ${branch.activo ? "inactiva" : "activa"}. ¿Deseas continuar?`)) {
          return;
        }
        const updated = await persistBranchStatus(branch.id, !branch.activo);
        if (selectedBranch?.id === updated.id && effectiveBranchDraft) {
          setBranchDraft({ ...effectiveBranchDraft, activo: updated.activo });
          setBranchDraftId(updated.id);
        }
        setMessage(`Sucursal ${updated.activo ? "activada" : "inactivada"} correctamente.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible cambiar el estado.");
      }
    },
    [effectiveBranchDraft, persistBranchStatus, selectedBranch],
  );

  const updateDaySchedule = useCallback(
    <K extends keyof BranchDaySchedule>(day: DayKey, field: K, value: BranchDaySchedule[K]) => {
      if (!effectiveBranchDraft) return;
      setBranchField("horarioDetalle", {
        ...effectiveBranchDraft.horarioDetalle,
        [day]: {
          ...effectiveBranchDraft.horarioDetalle[day],
          [field]: value,
        },
      });
    },
    [effectiveBranchDraft, setBranchField],
  );

  const addPolygonPoint = useCallback((point: GeoPoint) => {
    setLimitPolygonDraft([...effectiveLimitPolygon, point]);
    setMessage("");
    setError("");
  }, [effectiveLimitPolygon]);

  const undoPolygonPoint = useCallback(() => {
    if (!effectiveLimitPolygon.length) return;
    setLimitPolygonDraft(effectiveLimitPolygon.slice(0, -1));
  }, [effectiveLimitPolygon]);

  const clearPolygon = useCallback(() => {
    setLimitPolygonDraft([]);
  }, []);

  const saveHomeVisitLimit = useCallback(async () => {
    if (effectiveLimitPolygon.length < 3) {
      setError("La geocerca requiere al menos 3 puntos.");
      return;
    }

    setError("");
    setMessage("");

    try {
      if (!window.confirm("Actualizarás el límite de atención a domicilio. ¿Deseas continuar?")) {
        return;
      }

      await persistHomeVisitLimit({
        nombre: effectiveLimitName,
        descripcion: effectiveLimitDescription || null,
        color: homeVisitLimit?.color || "#1de9b6",
        activo: effectiveLimitActive,
        polygon: effectiveLimitPolygon,
      });
      setMessage("Geocerca guardada correctamente.");
      setLimitPolygonDraft(null);
      setLimitActiveDraft(null);
      setLimitNameDraft(null);
      setLimitDescriptionDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la geocerca.");
    }
  }, [effectiveLimitActive, effectiveLimitDescription, effectiveLimitName, effectiveLimitPolygon, homeVisitLimit, persistHomeVisitLimit]);

  const startNewBranch = useCallback(() => {
    setActiveTab("sucursal");
    setCreatingBranch(true);
    setSelectedBranchId(null);
    setBranchDraftId(null);
    setBranchDraft(buildEmptyBranchDraft());
    setMessage("");
    setError("");
  }, []);

  if (loading && !branches.length && !homeVisitLimit) {
    return <p className={styles.emptyText}>Cargando sucursales y geocerca...</p>;
  }

  if (!branches.length && !homeVisitLimit && !creatingBranch) {
    return <p className={styles.emptyText}>No hay ubicaciones ni geocerca para mostrar.</p>;
  }

  return (
    <section className={styles.adminLocationsLayout}>
      <aside className={styles.adminLocationsListPane}>
        <div className={styles.adminLocationsToolbar}>
          <div>
            <h3>Sucursales registradas</h3>
            <p>Busca, refresca o crea nuevas sucursales sin salir del editor.</p>
          </div>
          <div className={styles.adminLocationsToolbarActions}>
            <button type="button" className={styles.actionButtonSoft} onClick={() => void refresh()} disabled={refreshing}>
              {refreshing ? "Actualizando..." : "Refresh"}
            </button>
            <button type="button" className={styles.actionButtonEdit} onClick={startNewBranch} disabled={savingBranchId === -1}>
              {savingBranchId === -1 ? "Creando..." : "Nueva sucursal"}
            </button>
          </div>
        </div>

        <div className={styles.adminLocationsSummaryRow}>
          <span className={`${styles.adminStatusChip} ${styles.adminStatusSuccess}`}>{summary.activas} activas</span>
          <span className={`${styles.adminStatusChip} ${styles.adminStatusPending}`}>{summary.total} registradas</span>
          {creatingBranch ? <span className={`${styles.adminStatusChip} ${styles.adminStatusPending}`}>Nueva sucursal</span> : null}
        </div>

        <label className={styles.adminField}>
          <span>Buscar sucursal</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nombre, dirección, teléfono..."
          />
        </label>

        <div className={styles.adminLocationCards}>
          {filteredBranches.map((branch) => {
            const selected = branch.id !== null && selectedBranch?.id === branch.id;
            const loadingBranch = branch.id !== null && savingBranchId === branch.id;

            return (
              <article
                key={`${branch.id ?? "sin-id"}-${branch.nombre}`}
                className={`${styles.adminLocationCard} ${selected ? styles.adminLocationCardSelected : ""}`}
                onClick={() => {
                  setCreatingBranch(false);
                  setSelectedBranchId(branch.id);
                  if (branch.id !== null) {
                    setBranchDraftId(branch.id);
                    setBranchDraft(buildDraftFromBranch(branch));
                  }
                  setMessage("");
                  setError("");
                }}
              >
                <div className={styles.adminLocationCardHeader}>
                  <strong>{branch.nombre || "Sucursal sin nombre"}</strong>
                  <span className={`${styles.adminStatusChip} ${branch.activo ? styles.adminStatusSuccess : styles.adminStatusDanger}`}>
                    {branch.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <p>{branch.direccion || "Sin dirección"}</p>
                <small>{branch.telefono || "Sin teléfono"}</small>

                <div className={styles.adminLocationCardActions}>
                  <button
                    type="button"
                    className={styles.actionButtonDanger}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleBranchStatus(branch);
                    }}
                    disabled={loadingBranch}
                  >
                    {loadingBranch ? "Guardando..." : branch.activo ? "Inactivar" : "Activar"}
                  </button>
                </div>
              </article>
            );
          })}
          {!filteredBranches.length ? <p className={styles.emptyText}>No hay coincidencias para esa búsqueda.</p> : null}
        </div>
      </aside>

      <div className={styles.adminLocationsEditorPane}>
        <div className={styles.adminLocationsTabs}>
          <button
            type="button"
            className={`${styles.adminLocationTabButton} ${activeTab === "sucursal" ? styles.adminLocationTabButtonActive : ""}`}
            onClick={() => setActiveTab("sucursal")}
          >
            Ubicación de sucursal
          </button>
          <button
            type="button"
            className={`${styles.adminLocationTabButton} ${activeTab === "geocerca" ? styles.adminLocationTabButtonActive : ""}`}
            onClick={() => setActiveTab("geocerca")}
          >
            Geocerca domicilio
          </button>
        </div>

        {activeTab === "sucursal" ? (
          <div className={styles.adminLocationFormWrap}>
            {!effectiveBranchDraft ? (
              <p className={styles.emptyText}>Selecciona una sucursal para editarla.</p>
            ) : (
              <>
                <div className={styles.adminFieldGridTwo}>
                  <label className={styles.adminField}>
                    <span>Nombre</span>
                    <input
                      value={effectiveBranchDraft.nombre}
                      onChange={(event) => setBranchField("nombre", event.target.value)}
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>Resumen horario</span>
                    <input value={effectiveScheduleSummary} readOnly />
                  </label>
                </div>

                <label className={styles.adminField}>
                  <span>Descripción</span>
                  <textarea
                    rows={2}
                    value={effectiveBranchDraft.descripcion}
                    onChange={(event) => setBranchField("descripcion", event.target.value)}
                  />
                </label>

                <label className={styles.adminField}>
                  <span>Dirección</span>
                  <input
                    value={effectiveBranchDraft.direccion}
                    onChange={(event) => setBranchField("direccion", event.target.value)}
                  />
                </label>

                <div className={styles.adminFieldGridThree}>
                  <label className={styles.adminField}>
                    <span>Teléfono</span>
                    <input
                      value={effectiveBranchDraft.telefono}
                      onChange={(event) => setBranchField("telefono", event.target.value)}
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>WhatsApp</span>
                    <input
                      value={effectiveBranchDraft.whatsapp}
                      onChange={(event) => setBranchField("whatsapp", event.target.value)}
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>Correo</span>
                    <input
                      value={effectiveBranchDraft.correo}
                      onChange={(event) => setBranchField("correo", event.target.value)}
                    />
                  </label>
                </div>

                <div className={styles.adminFieldGridTwo}>
                  <label className={styles.adminField}>
                    <span>Latitud</span>
                    <input
                      value={effectiveBranchDraft.latitud ?? ""}
                      onChange={(event) => setBranchField("latitud", toNumber(event.target.value))}
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>Longitud</span>
                    <input
                      value={effectiveBranchDraft.longitud ?? ""}
                      onChange={(event) => setBranchField("longitud", toNumber(event.target.value))}
                    />
                  </label>
                </div>

                <div className={styles.adminFieldGridThree}>
                  <label className={styles.adminField}>
                    <span>Instagram</span>
                    <input
                      value={effectiveBranchDraft.instagramUrl}
                      onChange={(event) => setBranchField("instagramUrl", event.target.value)}
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>Facebook</span>
                    <input
                      value={effectiveBranchDraft.facebookUrl}
                      onChange={(event) => setBranchField("facebookUrl", event.target.value)}
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>TikTok</span>
                    <input
                      value={effectiveBranchDraft.tiktokUrl}
                      onChange={(event) => setBranchField("tiktokUrl", event.target.value)}
                    />
                  </label>
                </div>

                <div className={styles.adminSocialPreviewRow}>
                  {socialButtons.map((social) =>
                    social.href ? (
                      <a
                        key={social.key}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.adminSocialIconButton}
                        title={social.label}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Image src={social.icon} alt={social.label} width={26} height={26} />
                      </a>
                    ) : (
                      <span
                        key={social.key}
                        className={`${styles.adminSocialIconButton} ${styles.adminSocialIconDisabled}`}
                        title={`${social.label} sin configurar`}
                      >
                        <Image src={social.icon} alt={social.label} width={26} height={26} />
                      </span>
                    ),
                  )}
                </div>

                <div className={styles.adminFieldGridTwo}>
                  <label className={styles.adminField}>
                    <span>Imagen URL</span>
                    <input
                      value={effectiveBranchDraft.imagenUrl}
                      onChange={(event) => setBranchField("imagenUrl", event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label className={styles.adminField}>
                    <span>Imagen path</span>
                    <input
                      value={effectiveBranchDraft.imagenPath}
                      onChange={(event) => setBranchField("imagenPath", event.target.value)}
                      placeholder="/media/..."
                    />
                  </label>
                </div>

                {branchReferenceImage ? (
                  <div
                    className={styles.adminImagePreview}
                    style={{ backgroundImage: `url(${branchReferenceImage})` }}
                    role="img"
                    aria-label="Vista previa de sucursal"
                  />
                ) : null}

                <div className={styles.adminSchedulePanel}>
                  <p className={styles.adminScheduleTitle}>Horarios por dia y turnos</p>
                  <p className={styles.adminHintText}>
                    Activa cada dia y define turno manana y segundo turno (tarde o noche).
                  </p>

                  <div className={styles.adminScheduleRows}>
                    {DAY_KEYS.map((day) => {
                      const daySchedule = effectiveBranchDraft.horarioDetalle[day];
                      return (
                        <article key={day} className={styles.adminScheduleRow}>
                          <div className={styles.adminScheduleRowTop}>
                            <label className={styles.adminSwitchFieldInline}>
                              <input
                                type="checkbox"
                                checked={daySchedule.activo}
                                onChange={(event) => updateDaySchedule(day, "activo", event.target.checked)}
                              />
                              <span>{DAY_LABELS[day]}</span>
                            </label>

                            <label className={styles.adminField}>
                              <span>Tipo turno 2</span>
                              <select
                                value={daySchedule.segundoTurnoTipo}
                                onChange={(event) =>
                                  updateDaySchedule(day, "segundoTurnoTipo", event.target.value === "noche" ? "noche" : "tarde")
                                }
                                disabled={!daySchedule.activo}
                              >
                                <option value="tarde">Tarde</option>
                                <option value="noche">Noche</option>
                              </select>
                            </label>

                            <label className={styles.adminSwitchFieldInline}>
                              <input
                                type="checkbox"
                                checked={daySchedule.segundoTurnoActivo}
                                onChange={(event) => updateDaySchedule(day, "segundoTurnoActivo", event.target.checked)}
                                disabled={!daySchedule.activo}
                              />
                              <span>Activar turno 2</span>
                            </label>
                          </div>

                          <div className={styles.adminFieldGridFour}>
                            <label className={styles.adminField}>
                              <span>Manana inicio</span>
                              <input
                                type="time"
                                value={daySchedule.mananaInicio}
                                onChange={(event) => updateDaySchedule(day, "mananaInicio", event.target.value)}
                                disabled={!daySchedule.activo}
                              />
                            </label>
                            <label className={styles.adminField}>
                              <span>Manana fin</span>
                              <input
                                type="time"
                                value={daySchedule.mananaFin}
                                onChange={(event) => updateDaySchedule(day, "mananaFin", event.target.value)}
                                disabled={!daySchedule.activo}
                              />
                            </label>
                            <label className={styles.adminField}>
                              <span>{daySchedule.segundoTurnoTipo === "noche" ? "Noche inicio" : "Tarde inicio"}</span>
                              <input
                                type="time"
                                value={daySchedule.segundoTurnoInicio}
                                onChange={(event) => updateDaySchedule(day, "segundoTurnoInicio", event.target.value)}
                                disabled={!daySchedule.activo || !daySchedule.segundoTurnoActivo}
                              />
                            </label>
                            <label className={styles.adminField}>
                              <span>{daySchedule.segundoTurnoTipo === "noche" ? "Noche fin" : "Tarde fin"}</span>
                              <input
                                type="time"
                                value={daySchedule.segundoTurnoFin}
                                onChange={(event) => updateDaySchedule(day, "segundoTurnoFin", event.target.value)}
                                disabled={!daySchedule.activo || !daySchedule.segundoTurnoActivo}
                              />
                            </label>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <label className={styles.adminField}>
                  <span>Notas</span>
                  <textarea
                    rows={2}
                    value={effectiveBranchDraft.notas}
                    onChange={(event) => setBranchField("notas", event.target.value)}
                  />
                </label>

                <label className={styles.adminSwitchField}>
                  <input
                    type="checkbox"
                    checked={effectiveBranchDraft.activo}
                    onChange={(event) => setBranchField("activo", event.target.checked)}
                  />
                  <span>Sucursal activa para pacientes</span>
                </label>
              </>
            )}
          </div>
        ) : (
          <div className={styles.adminLocationFormWrap}>
            <div className={styles.adminFieldGridTwo}>
              <label className={styles.adminField}>
                <span>Nombre de zona</span>
                <input value={effectiveLimitName} onChange={(event) => setLimitNameDraft(event.target.value)} />
              </label>
              <label className={styles.adminSwitchFieldInline}>
                <input
                  type="checkbox"
                  checked={effectiveLimitActive}
                  onChange={(event) => setLimitActiveDraft(event.target.checked)}
                />
                <span>Geocerca activa</span>
              </label>
            </div>

            <label className={styles.adminField}>
              <span>Descripción</span>
              <textarea
                rows={2}
                value={effectiveLimitDescription}
                onChange={(event) => setLimitDescriptionDraft(event.target.value)}
              />
            </label>

            <div className={styles.adminPolygonActions}>
              <button type="button" className={styles.actionButtonSoft} onClick={undoPolygonPoint}>
                Deshacer punto
              </button>
              <button type="button" className={styles.actionButtonDanger} onClick={clearPolygon}>
                Limpiar geocerca
              </button>
              <button type="button" className={styles.actionButtonEdit} onClick={saveHomeVisitLimit} disabled={savingLimit}>
                {savingLimit ? "Guardando..." : "Guardar geocerca"}
              </button>
            </div>

            <p className={styles.adminHintText}>Puntos actuales: {effectiveLimitPolygon.length} (mínimo 3).</p>
          </div>
        )}

        <AdminLocationsMapClient
          center={mapCenter}
          branchPoint={branchPoint}
          polygon={effectiveLimitPolygon}
          polygonEnabled={effectiveLimitActive}
          polygonEditable={activeTab === "geocerca"}
          onPickPoint={
            activeTab === "geocerca"
              ? addPolygonPoint
              : (point) => {
                  setBranchField("latitud", point.lat);
                  setBranchField("longitud", point.lng);
                }
          }
        />

        <div className={styles.adminLocationsFooterActions}>
          {activeTab === "sucursal" ? (
            <button type="button" className={styles.actionButtonEdit} onClick={saveBranch} disabled={savingBranchId !== null}>
              {savingBranchId !== null ? "Guardando..." : creatingBranch ? "Crear sucursal" : "Guardar sucursal"}
            </button>
          ) : null}
          {message ? <p className={styles.adminInlineSuccess}>{message}</p> : null}
          {effectiveError ? <p className={styles.adminInlineError}>{effectiveError}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default memo(AdminLocationsSection);
