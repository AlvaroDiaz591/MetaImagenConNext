"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { PatientLandingServiceItem } from "../../domain/entities/PatientLandingCatalog";
import styles from "../styles/PatientLanding.module.css";

type CarouselType = "fisioterapia" | "estetica";

type CarouselRenderableItem = {
  id: string;
  sourceId: number | null;
  title: string;
  subtitle: string;
  description: string;
  price: number | null;
  durationMinutes: number | null;
  tags: string[];
  benefits: string[];
  imageUrl: string | null;
  videoUrl: string | null;
};

type PatientOrbitRingsProps = {
  fisioterapiaItems: PatientLandingServiceItem[];
  esteticaItems: PatientLandingServiceItem[];
  enableVideoPlayback?: boolean;
  onSelectAgendaService?: (service: AgendaServiceSelection) => void;
};

export type AgendaServiceSelection = {
  id: number | null;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number | null;
  duracionMinutos: number | null;
};

const MAX_ITEMS_PER_CAROUSEL = 12;
const MIN_ITEMS_PER_CAROUSEL = 10;
const priceFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

const formatPrice = (price: number | null): string => {
  if (price === null || !Number.isFinite(price)) return "Precio por evaluar";
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

const toRenderableItems = (items: PatientLandingServiceItem[]): CarouselRenderableItem[] =>
  items.slice(0, MAX_ITEMS_PER_CAROUSEL).map((item, index) => ({
    id: `${item.id ?? "x"}-${index}`,
    sourceId: item.id,
    title: item.nombre,
    subtitle: item.categoria || item.segmento || "Servicio",
    description: item.descripcion || "Servicio disponible en Meta Imagen.",
    price: item.precio,
    durationMinutes: item.duracionMinutos,
    tags: item.tags || [],
    benefits: item.beneficios || [],
    imageUrl: item.imagenUrl,
    videoUrl: item.videoUrl,
  }));

const buildCarouselItems = (
  items: CarouselRenderableItem[],
  minItems: number,
): CarouselRenderableItem[] => {
  const fallback: CarouselRenderableItem = {
    id: "fallback",
    sourceId: null,
    title: "Meta Imagen",
    subtitle: "Servicios",
    description: "Tratamientos y servicios para tu bienestar.",
    price: null,
    durationMinutes: null,
    tags: [],
    benefits: [],
    imageUrl: null,
    videoUrl: null,
  };

  const pool = items.length > 0 ? items : [fallback];
  const targetCount = Math.max(minItems, pool.length);

  return Array.from({ length: targetCount }, (_, index) => {
    const source = pool[index % pool.length];
    return {
      ...source,
      id: `${source.id}-carousel-${index}`,
    };
  });
};

const ServicesCarousel = memo(
  ({
    items,
    carouselType,
    enableVideoPlayback,
    onSelectAgendaService,
  }: {
    items: CarouselRenderableItem[];
    carouselType: CarouselType;
    enableVideoPlayback?: boolean;
    onSelectAgendaService?: (service: AgendaServiceSelection) => void;
  }) => {
    const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
    const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const safeItems = useMemo(() => buildCarouselItems(items, MIN_ITEMS_PER_CAROUSEL), [items]);

    const openVideo = useCallback((url: string, title: string) => {
      if (!enableVideoPlayback) {
        return;
      }
      setActiveVideo({ url, title });
    }, [enableVideoPlayback]);

    const closeVideo = useCallback(() => {
      setActiveVideo(null);
    }, []);

    const goToAgenda = useCallback((item: CarouselRenderableItem) => {
      onSelectAgendaService?.({
        id: item.sourceId,
        nombre: item.title,
        categoria: item.subtitle,
        descripcion: item.description,
        precio: item.price,
        duracionMinutos: item.durationMinutes,
      });

      const section = document.getElementById("agenda");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, [onSelectAgendaService]);

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

    useEffect(() => {
      if (!activeVideo || !videoRef.current) {
        return;
      }

      const video = videoRef.current;
      video.muted = false;
      video.volume = 1;

      const ensurePlay = () => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            // Algunos navegadores pueden bloquear autoplay con audio.
          });
        }
      };

      ensurePlay();
      const raf = window.requestAnimationFrame(ensurePlay);
      return () => {
        window.cancelAnimationFrame(raf);
      };
    }, [activeVideo]);

    const isReverse = carouselType === "estetica";

    return (
      <section className={styles.carousel3DSection}>
        <header className={styles.carousel3DHeader}>
          <h3>{carouselType === "fisioterapia" ? "Fisioterapia y Kinesiologia" : "Estetica"}</h3>
          <p>{safeItems.length} servicios en carrusel 3D</p>
        </header>

        <div className={styles.carousel3DViewport}>
          <div
            className={`${styles.carousel3DTrack} ${isReverse ? styles.carousel3DTrackReverse : ""}`}
            style={{ "--carousel-duration": isReverse ? "52s" : "46s" } as CSSProperties}
          >
            {safeItems.map((item, index) => {
              const angle = `${(360 / safeItems.length) * index}deg`;
              const cardStyle = {
                "--carousel-angle": angle,
                "--entry-delay": `${index * 58}ms`,
              } as CSSProperties;
              const isFlipped = flippedCardId === item.id;

              return (
                <article
                  className={styles.carousel3DOrbitCard}
                  style={cardStyle}
                  key={item.id}
                >
                  <div className={`${styles.carousel3DCardInner} ${isFlipped ? styles.carousel3DCardInnerFlipped : ""}`}>
                    <div
                      className={`${styles.carousel3DCardFace} ${styles.carousel3DCardFront}`}
                      onClick={() => setFlippedCardId(item.id)}
                      data-esp32-clickable="true"
                    >
                      <div className={styles.carousel3DCardMedia}>
                        {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.title} loading="lazy" />
                        ) : (
                          <div className={styles.carousel3DCardFallback} aria-hidden="true" />
                        )}
                        <div className={styles.carousel3DCardAura} aria-hidden="true" />
                      </div>

                      <div className={styles.carousel3DCardInfo}>
                        <p>{item.title}</p>
                        <span>{item.subtitle}</span>
                        {item.videoUrl ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openVideo(item.videoUrl as string, item.title);
                            }}
                            data-esp32-clickable="true"
                          >
                            Ver video
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className={`${styles.carousel3DCardFace} ${styles.carousel3DCardBack}`}>
                      <strong>{item.title}</strong>
                      <div className={styles.carousel3DBackMeta}>
                        <span>{formatPrice(item.price)}</span>
                        <span>{formatDuration(item.durationMinutes)}</span>
                      </div>
                      <div className={styles.carousel3DBackContent}>
                        <p className={styles.carousel3DBackDescription}>{item.description}</p>
                        {item.benefits.length > 0 ? (
                          <ul className={styles.carousel3DBackList} aria-label="Beneficios del servicio">
                            {item.benefits.slice(0, 3).map((benefit) => (
                              <li key={`${item.id}-benefit-${benefit}`}>{benefit}</li>
                            ))}
                          </ul>
                        ) : null}
                        {item.tags.length > 0 ? (
                          <p className={styles.carousel3DBackTags}>
                            {item.tags.slice(0, 4).map((tag) => `#${tag}`).join(" ")}
                          </p>
                        ) : null}
                      </div>
                      <div className={styles.carousel3DCardBackActions}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFlippedCardId(null);
                          }}
                          data-esp32-clickable="true"
                        >
                          Volver
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToAgenda(item);
                          }}
                          data-esp32-clickable="true"
                        >
                          Agendar este servicio
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {activeVideo ? (
          <div className={styles.carouselVideoModalBackdrop} onClick={closeVideo} data-esp32-clickable="true">
            <div className={styles.carouselVideoModal} onClick={(event) => event.stopPropagation()}>
              <div className={styles.carouselVideoModalHeader}>
                <p>{activeVideo.title}</p>
                <button type="button" onClick={closeVideo} data-esp32-clickable="true">
                  Cerrar
                </button>
              </div>
              <video
                key={activeVideo.url}
                src={activeVideo.url}
                ref={videoRef}
                className={styles.carouselVideoPlayer}
                autoPlay
                muted={false}
                loop
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        ) : null}
      </section>
    );
  },
);

ServicesCarousel.displayName = "ServicesCarousel";

const PatientOrbitRings = ({
  fisioterapiaItems,
  esteticaItems,
  enableVideoPlayback = true,
  onSelectAgendaService,
}: PatientOrbitRingsProps) => {
  const leftItems = useMemo(() => toRenderableItems(fisioterapiaItems), [fisioterapiaItems]);
  const rightItems = useMemo(() => toRenderableItems(esteticaItems), [esteticaItems]);

  return (
    <div className={styles.services3DCarouselsRoot}>
      <ServicesCarousel
        items={leftItems}
        carouselType="fisioterapia"
        enableVideoPlayback={enableVideoPlayback}
        onSelectAgendaService={onSelectAgendaService}
      />
      <ServicesCarousel
        items={rightItems}
        carouselType="estetica"
        enableVideoPlayback={enableVideoPlayback}
        onSelectAgendaService={onSelectAgendaService}
      />
    </div>
  );
};

export default memo(PatientOrbitRings);
