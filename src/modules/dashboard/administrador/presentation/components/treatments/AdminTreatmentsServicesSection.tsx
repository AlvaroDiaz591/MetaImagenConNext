import Image from "next/image";
import { API_BASE_URL } from "@/src/shared/config/api";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/AdminDashboard.module.css";

type AdminTreatmentsServicesSectionProps = {
  filas: Array<Record<string, unknown>>;
  onViewRow: (row: Record<string, unknown>) => void;
  onToggleActiveRow?: (row: Record<string, unknown>) => void;
  actionLoadingId?: number | null;
};

type TreatmentCardData = {
  id: number | null;
  nombre: string;
  descripcion: string;
  categoria: string;
  segmento: string;
  precio: number | null;
  duracionMinutos: number | null;
  destacado: boolean;
  activo: boolean;
  mostrarEnWeb: boolean;
  mostrarEnApp: boolean;
  disponibleEnClinica: boolean;
  disponibleADomicilio: boolean;
  orden: number | null;
  imagenUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  beneficios: string[];
  raw: Record<string, unknown>;
};

type TreatmentServiceCardProps = {
  item: TreatmentCardData;
  isLoading: boolean;
  onViewRow: (row: Record<string, unknown>) => void;
  onToggleRow?: (row: Record<string, unknown>) => void;
  onOpenVideo: (url: string, title: string) => void;
};

const INITIAL_VISIBLE_CARDS = 12;
const CARDS_BATCH_SIZE = 8;
const priceFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replaceAll(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim().toLowerCase();
  if (["1", "true", "t", "yes", "si", "sí", "activo", "activa"].includes(raw)) return true;
  if (["0", "false", "f", "no", "inactivo", "inactiva", "inactive"].includes(raw)) return false;
  return fallback;
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

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .slice(0, 8);
  }

  const raw = normalizeText(value);
  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => normalizeText(item))
          .filter(Boolean)
          .slice(0, 8);
      }
    } catch {
      // Si no es JSON valido, cae al split por separadores.
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

const formatPrice = (price: number | null): string => {
  if (price === null) return "Precio por evaluar";
  return priceFormatter.format(price);
};

const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) return "Duracion flexible";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
};

const normalizeCard = (row: Record<string, unknown>): TreatmentCardData => {
  const estado = normalizeText(row.estado).toLowerCase();
  const activo = row.activo !== undefined ? toBool(row.activo, true) : estado !== "inactivo";

  return {
    id: getRecordId(row),
    nombre: normalizeText(row.nombre) || "Servicio sin nombre",
    descripcion: normalizeText(row.descripcion) || "Sin descripcion clinica.",
    categoria: normalizeText(row.categoria) || "General",
    segmento: normalizeText(row.segmento),
    precio: toNumber(row.precio_desde ?? row.precio),
    duracionMinutos: toNumber(row.duracion_minutos ?? row.duracion),
    destacado: toBool(row.destacado, false),
    activo,
    mostrarEnWeb: toBool(row.mostrar_en_web, true),
    mostrarEnApp: toBool(row.mostrar_en_app, true),
    disponibleEnClinica: toBool(row.disponible_en_clinica, true),
    disponibleADomicilio: toBool(row.disponible_a_domicilio, false),
    orden: toNumber(row.orden),
    imagenUrl: resolveMediaUrl(row.imagen_path ?? row.imagen_url ?? row.imagen),
    videoUrl: resolveMediaUrl(row.video_path ?? row.video_url ?? row.video),
    tags: parseList(row.tags),
    beneficios: parseList(row.beneficios),
    raw: row,
  };
};

const TreatmentServiceCard = memo(
  ({ item, isLoading, onViewRow, onToggleRow, onOpenVideo }: TreatmentServiceCardProps) => {
    return (
      <article
        className={`${styles.treatmentCard} ${!item.activo ? styles.treatmentCardInactive : ""}`}
        onClick={() => onViewRow(item.raw)}
        data-esp32-clickable="true"
      >
        <div className={styles.treatmentMediaWrap}>
          {item.imagenUrl ? (
            <Image
              src={item.imagenUrl}
              alt={item.nombre}
              className={styles.treatmentMedia}
              fill
              sizes="(max-width: 920px) 100vw, 320px"
              loading="lazy"
              unoptimized
            />
          ) : (
            <div className={styles.treatmentMediaFallback} aria-hidden="true" />
          )}

          <div className={styles.treatmentLogoCenter}>
            <Image src="/assets/login/logo.png" alt="Meta Imagen" className={styles.treatmentLogo} width={44} height={44} />
          </div>

          <div className={styles.treatmentOverlayTop}>
            {item.destacado ? <span className={styles.treatmentTopChip}>Destacado</span> : null}
            {!item.activo ? <span className={styles.treatmentTopChipMuted}>Inactivo</span> : null}
          </div>

          {item.videoUrl ? (
            <button
              type="button"
              className={styles.treatmentVideoButton}
              data-esp32-clickable="true"
              onClick={(event) => {
                event.stopPropagation();
                onOpenVideo(item.videoUrl as string, item.nombre);
              }}
            >
              Ver video
            </button>
          ) : null}
        </div>

        <div className={styles.treatmentBody}>
          <h3 className={styles.treatmentTitle}>{item.nombre}</h3>
          <p className={styles.treatmentDescription}>{item.descripcion}</p>

          <div className={styles.treatmentMainMeta}>
            <span>{formatPrice(item.precio)}</span>
            <span>{formatDuration(item.duracionMinutos)}</span>
          </div>

          <div className={styles.treatmentInfoChips}>
            <span className={styles.treatmentInfoChip}>{item.categoria}</span>
            {item.segmento ? <span className={styles.treatmentInfoChip}>{item.segmento}</span> : null}
            {item.disponibleEnClinica ? <span className={styles.treatmentInfoChip}>Clinica</span> : null}
            {item.disponibleADomicilio ? <span className={styles.treatmentInfoChip}>Domicilio</span> : null}
            {item.mostrarEnWeb ? <span className={styles.treatmentInfoChip}>Web</span> : null}
            {item.mostrarEnApp ? <span className={styles.treatmentInfoChip}>App</span> : null}
            {item.orden !== null ? <span className={styles.treatmentInfoChip}>Orden {item.orden}</span> : null}
          </div>

          {item.tags.length > 0 ? (
            <p className={styles.treatmentTags}>{item.tags.slice(0, 4).map((tag) => `#${tag}`).join(" ")}</p>
          ) : null}

          {item.beneficios.length > 0 ? (
            <p className={styles.treatmentBenefits}>{item.beneficios.slice(0, 2).join(" • ")}</p>
          ) : null}

          <div className={styles.treatmentActions}>
            <button
              type="button"
              className={styles.treatmentViewButton}
              onClick={(event) => {
                event.stopPropagation();
                onViewRow(item.raw);
              }}
              data-esp32-clickable="true"
            >
              Ver detalle
            </button>

            {onToggleRow ? (
              <button
                type="button"
                className={styles.treatmentToggleButton}
                disabled={isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleRow(item.raw);
                }}
                data-esp32-clickable="true"
              >
                {isLoading ? "Guardando..." : item.activo ? "Inactivar" : "Activar"}
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  },
);

TreatmentServiceCard.displayName = "TreatmentServiceCard";

const AdminTreatmentsServicesSection = ({
  filas,
  onViewRow,
  onToggleActiveRow,
  actionLoadingId = null,
}: AdminTreatmentsServicesSectionProps) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [soloActivos, setSoloActivos] = useState(false);
  const [soloDestacados, setSoloDestacados] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const [visibleWindow, setVisibleWindow] = useState<{ key: string; count: number }>({
    key: "",
    count: INITIAL_VISIBLE_CARDS,
  });
  const gridRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const openVideo = useCallback((url: string, title: string) => {
    setActiveVideo({ url, title });
  }, []);

  const closeVideo = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const handleViewRow = useCallback(
    (row: Record<string, unknown>) => {
      onViewRow(row);
    },
    [onViewRow],
  );

  const handleToggleRow = useCallback(
    (row: Record<string, unknown>) => {
      onToggleActiveRow?.(row);
    },
    [onToggleActiveRow],
  );

  useEffect(() => {
    if (!activeVideo) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeVideo();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeVideo, closeVideo]);

  const cards = useMemo(() => filas.map((row) => normalizeCard(row)), [filas]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((card) => {
      if (card.categoria) set.add(card.categoria);
    });
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (categoriaSeleccionada !== "Todas" && card.categoria !== categoriaSeleccionada) return false;
      if (soloActivos && !card.activo) return false;
      if (soloDestacados && !card.destacado) return false;
      return true;
    });
  }, [cards, categoriaSeleccionada, soloActivos, soloDestacados]);

  const filtersKey = useMemo(
    () => `${categoriaSeleccionada}|${soloActivos ? 1 : 0}|${soloDestacados ? 1 : 0}|${filas.length}`,
    [categoriaSeleccionada, filas.length, soloActivos, soloDestacados],
  );

  const visibleCardsCount = visibleWindow.key === filtersKey ? visibleWindow.count : INITIAL_VISIBLE_CARDS;
  const canUseIntersectionObserver = typeof IntersectionObserver !== "undefined";

  const loadMoreCards = useCallback(() => {
    setVisibleWindow((current) => {
      const currentCount = current.key === filtersKey ? current.count : INITIAL_VISIBLE_CARDS;
      const nextCount = Math.min(currentCount + CARDS_BATCH_SIZE, filteredCards.length);
      if (current.key === filtersKey && nextCount === currentCount) {
        return current;
      }
      return {
        key: filtersKey,
        count: nextCount,
      };
    });
  }, [filteredCards.length, filtersKey]);

  const visibleCards = useMemo(
    () => filteredCards.slice(0, visibleCardsCount),
    [filteredCards, visibleCardsCount],
  );
  const canLoadMoreCards = visibleCardsCount < filteredCards.length;

  useEffect(() => {
    if (!canLoadMoreCards || !canUseIntersectionObserver) {
      return;
    }

    const root = gridRef.current;
    const target = loadMoreRef.current;
    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        loadMoreCards();
      },
      {
        root,
        rootMargin: "220px 0px 220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [canLoadMoreCards, canUseIntersectionObserver, loadMoreCards]);

  if (cards.length === 0) {
    return <p className={styles.emptyText}>No hay tratamientos o servicios registrados.</p>;
  }

  return (
    <section className={styles.treatmentsSection}>
      <div className={styles.treatmentsFilters}>
        <div className={styles.treatmentsCategoryChips}>
          {categorias.map((categoria) => {
            const isActive = categoriaSeleccionada === categoria;
            return (
              <button
                key={categoria}
                type="button"
                className={`${styles.treatmentFilterChip} ${isActive ? styles.treatmentFilterChipActive : ""}`}
                onClick={() => setCategoriaSeleccionada(categoria)}
                data-esp32-clickable="true"
              >
                {categoria}
              </button>
            );
          })}
        </div>

        <div className={styles.treatmentsToggleRow}>
          <button
            type="button"
            className={`${styles.treatmentToggle} ${soloActivos ? styles.treatmentToggleActive : ""}`}
            onClick={() => setSoloActivos((current) => !current)}
            data-esp32-clickable="true"
          >
            Solo activos
          </button>
          <button
            type="button"
            className={`${styles.treatmentToggle} ${soloDestacados ? styles.treatmentToggleActive : ""}`}
            onClick={() => setSoloDestacados((current) => !current)}
            data-esp32-clickable="true"
          >
            Solo destacados
          </button>
        </div>
      </div>

      <div className={styles.treatmentsGrid} ref={gridRef}>
        {visibleCards.map((item) => {
          const isLoading = item.id !== null && actionLoadingId === item.id;
          return (
            <TreatmentServiceCard
              key={String(item.id ?? item.nombre)}
              item={item}
              isLoading={isLoading}
              onViewRow={handleViewRow}
              onToggleRow={handleToggleRow}
              onOpenVideo={openVideo}
            />
          );
        })}
        {canLoadMoreCards && canUseIntersectionObserver ? (
          <div ref={loadMoreRef} className={styles.treatmentsLoadMoreSentinel} aria-hidden="true" />
        ) : null}
      </div>

      {canLoadMoreCards && !canUseIntersectionObserver ? (
        <button type="button" className={styles.treatmentsLoadMoreButton} onClick={loadMoreCards} data-esp32-clickable="true">
          Cargar mas
        </button>
      ) : null}

      {filteredCards.length === 0 ? (
        <p className={styles.emptyText}>No hay resultados con los filtros seleccionados.</p>
      ) : null}

      {activeVideo ? (
        <div
          className={styles.treatmentVideoModalBackdrop}
          onClick={closeVideo}
          data-esp32-clickable="true"
        >
          <div
            className={styles.treatmentVideoModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Video del servicio ${activeVideo.title}`}
          >
            <div className={styles.treatmentVideoModalHeader}>
              <p className={styles.treatmentVideoModalTitle}>{activeVideo.title}</p>
              <button
                type="button"
                className={styles.treatmentVideoCloseButton}
                onClick={closeVideo}
                data-esp32-clickable="true"
                aria-label="Cerrar video"
              >
                Cerrar
              </button>
            </div>

            <video
              className={styles.treatmentVideoPlayer}
              src={activeVideo.url}
              controls
              preload="none"
              playsInline
            >
              Tu navegador no soporta reproduccion de video.
            </video>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default AdminTreatmentsServicesSection;
