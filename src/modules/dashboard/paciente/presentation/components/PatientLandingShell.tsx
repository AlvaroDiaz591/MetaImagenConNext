"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GetPatientLandingCatalogUseCase } from "../../application/usecases/GetPatientLandingCatalogUseCase";
import type {
  PatientLandingCatalog,
  PatientLandingBranch,
  PatientLandingDayKey,
  PatientLandingDaySchedule,
  PatientLandingServiceItem,
} from "../../domain/entities/PatientLandingCatalog";
import { PatientLandingCatalogApiAdapter } from "../../infrastructure/api/PatientLandingCatalogApiAdapter";
import PatientOrbitRings from "./PatientOrbitRings";
import type { AgendaServiceSelection } from "./PatientOrbitRings";
import PatientAgendaSection from "./agenda/PatientAgendaSection";
import PatientBranchLocationMap from "./location/PatientBranchLocationMap";
import PatientLogoutConfirmModal from "./modals/PatientLogoutConfirmModal";
import PatientLandingNav from "./navigation/PatientLandingNav";
import PatientBranchSocialCard from "./social/PatientBranchSocialCard";
import styles from "../styles/PatientLanding.module.css";

const isAdminRole = (role: string): boolean => {
  const normalized = role.trim().toLowerCase();
  return normalized === "administrador" || normalized === "admin" || normalized === "superadmin";
};

const isPatientRole = (role: string): boolean => {
  const normalized = role.trim().toLowerCase();
  return normalized === "paciente" || normalized === "patient" || normalized === "usuario";
};

const getToken = (): string =>
  window.localStorage.getItem("meta_imagen_token") || window.sessionStorage.getItem("meta_imagen_token") || "";

const normalizeText = (value: unknown): string => String(value || "").trim().toLowerCase();

const FISIO_KEYWORDS = ["fisio", "fisioterapia", "kinesio", "kinesiologia", "rehabilitacion", "terapia fisica"];
const ESTETICA_KEYWORDS = ["estetica", "facial", "corporal", "belleza", "depil", "rejuven", "limpieza"];

const DAY_ORDER: PatientLandingDayKey[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DAY_LABELS: Record<PatientLandingDayKey, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
  domingo: "Domingo",
};

const LANDING_NAV_ITEMS = [
  { id: "servicios", label: "Servicios" },
  { id: "agenda", label: "Agenda tu Cita" },
  { id: "ubicacion", label: "Ubicacion" },
  { id: "sobre-nosotros", label: "Sobre Nosotros" },
];

const CARE_PILLARS = [
  {
    title: "Recuperacion funcional",
    description: "Sesiones orientadas a movilidad, alivio del dolor y retorno seguro a tu rutina.",
  },
  {
    title: "Estetica con criterio clinico",
    description: "Protocolos faciales y corporales con acompanamiento profesional y seguimiento responsable.",
  },
  {
    title: "Agenda simple y precisa",
    description: "Reserva en clinica o a domicilio con disponibilidad, geocerca y seleccion guiada.",
  },
];

const toSocialHref = (value: string, kind: "instagram" | "facebook" | "tiktok" | "whatsapp"): string => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  if (kind === "whatsapp") {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length >= 8) return `https://wa.me/${digits}`;
  }

  return `https://${raw}`;
};

const buildDayText = (daySchedule?: PatientLandingDaySchedule): string => {
  if (!daySchedule || !daySchedule.activo) return "Cerrado";
  const morning = `${daySchedule.mananaInicio} - ${daySchedule.mananaFin}`;
  if (!daySchedule.segundoTurnoActivo) return morning;
  const secondLabel = daySchedule.segundoTurnoTipo === "noche" ? "Noche" : "Tarde";
  return `${morning} / ${secondLabel} ${daySchedule.segundoTurnoInicio} - ${daySchedule.segundoTurnoFin}`;
};

const getBranchScheduleHighlight = (branch?: PatientLandingBranch | null): string => {
  if (!branch) return "Agenda flexible segun disponibilidad.";

  const firstActiveDay = DAY_ORDER.find((day) => branch.horarioDetalle[day]?.activo);
  if (firstActiveDay) {
    return `${DAY_LABELS[firstActiveDay]} ${buildDayText(branch.horarioDetalle[firstActiveDay])}`;
  }

  return branch.horario || "Agenda flexible segun disponibilidad.";
};

const groupServices = (services: PatientLandingServiceItem[]) => {
  const fisioterapia: PatientLandingServiceItem[] = [];
  const estetica: PatientLandingServiceItem[] = [];
  const sinClasificar: PatientLandingServiceItem[] = [];

  services.forEach((item) => {
    const searchable = normalizeText(`${item.nombre} ${item.categoria} ${item.segmento} ${item.descripcion}`);
    const isFisio = FISIO_KEYWORDS.some((keyword) => searchable.includes(keyword));
    const isEstetica = ESTETICA_KEYWORDS.some((keyword) => searchable.includes(keyword));

    if (isFisio && !isEstetica) {
      fisioterapia.push(item);
      return;
    }

    if (isEstetica && !isFisio) {
      estetica.push(item);
      return;
    }

    sinClasificar.push(item);
  });

  sinClasificar.forEach((item) => {
    if (fisioterapia.length <= estetica.length) {
      fisioterapia.push(item);
      return;
    }
    estetica.push(item);
  });

  return {
    fisioterapia,
    estetica,
  };
};

const PatientLandingShell = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState<PatientLandingCatalog | null>(null);

  const [showIntroLine, setShowIntroLine] = useState(false);
  const [showIntroLogo, setShowIntroLogo] = useState(false);
  const [isLogoDocked, setIsLogoDocked] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [renderExperience, setRenderExperience] = useState(false);
  const [agendaService, setAgendaService] = useState<AgendaServiceSelection | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("servicios");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const landingUseCase = useMemo(
    () => new GetPatientLandingCatalogUseCase(new PatientLandingCatalogApiAdapter()),
    [],
  );

  const performLogout = useCallback(() => {
    window.localStorage.removeItem("meta_imagen_token");
    window.sessionStorage.removeItem("meta_imagen_token");
    window.localStorage.removeItem("meta_imagen_usuario");
    window.sessionStorage.removeItem("meta_imagen_usuario");
    window.localStorage.removeItem("meta_imagen_rol");
    window.sessionStorage.removeItem("meta_imagen_rol");
    router.replace("/login");
  }, [router]);

  const navigateSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAgendaSelection = useCallback((service: AgendaServiceSelection) => {
    setAgendaService(service);
  }, []);

  useEffect(() => {
    const timerLine = window.setTimeout(() => setShowIntroLine(true), 220);
    const timerLogo = window.setTimeout(() => setShowIntroLogo(true), 980);
    const timerDock = window.setTimeout(() => setIsLogoDocked(true), 2900);
    const timerOut = window.setTimeout(() => setIntroFinished(true), 3800);
    const timerRender = window.setTimeout(() => setRenderExperience(true), 4000);

    return () => {
      window.clearTimeout(timerLine);
      window.clearTimeout(timerLogo);
      window.clearTimeout(timerDock);
      window.clearTimeout(timerOut);
      window.clearTimeout(timerRender);
    };
  }, []);

  useEffect(() => {
    if (!introFinished) return;

    const sections = LANDING_NAV_ITEMS
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSectionId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-18% 0px -52% 0px",
        threshold: [0.2, 0.45, 0.68],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [introFinished]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;

    const loadCatalog = async () => {
      try {
        const result = await landingUseCase.execute({ token });
        if (!active) return;

        const role = result.rol || "Paciente";
        if (isAdminRole(role)) {
          router.replace("/dashboard/administrador");
          return;
        }

        if (!isPatientRole(role)) {
          setError("Tu cuenta no tiene permisos para la landing de pacientes.");
          return;
        }

        setCatalog(result);
      } catch (err) {
        if (!active) return;

        const message = err instanceof Error ? err.message : "No fue posible cargar la landing.";
        const needsLogout = ["token", "autorizacion", "sesion", "forbidden"].some((word) =>
          message.toLowerCase().includes(word),
        );

        if (needsLogout) {
          performLogout();
          return;
        }

        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      active = false;
    };
  }, [performLogout, landingUseCase, router]);

  const grouped = useMemo(() => {
    const services = catalog?.servicios || [];
    return groupServices(services);
  }, [catalog?.servicios]);
  const branches = catalog?.sucursales || [];
  const activeBranches = branches.filter((branch) => branch.activo);
  const activeBranchCount = activeBranches.length || branches.length;
  const totalServices = catalog?.servicios.length ?? 0;
  const featuredBranch = activeBranches[0] || branches[0] || null;
  const featuredBranchSummary =
    featuredBranch?.direccion || "Atencion clinica y a domicilio con acompanamiento profesional.";
  const featuredBranchHours = getBranchScheduleHighlight(featuredBranch);
  const heroStats = [
    {
      value: String(totalServices).padStart(2, "0"),
      label: "Tratamientos disponibles",
    },
    {
      value: String(activeBranchCount).padStart(2, "0"),
      label: "Sucursales y puntos de atencion",
    },
    {
      value: "3D",
      label: "Exploracion inmersiva del catalogo",
    },
  ];

  const welcomeName = catalog?.nombreVisible || "Paciente";
  const agendaToken = typeof window === "undefined" ? "" : getToken();

  return (
    <div className={styles.pageRoot}>
      <div
        className={`${styles.brandBadge} ${showIntroLogo ? styles.brandBadgeVisible : ""} ${
          isLogoDocked ? styles.brandBadgeDocked : styles.brandBadgeCentered
        }`}
      >
        <Image
          src="/assets/login/logo.png"
          alt="Meta Imagen"
          width={500}
          height={500}
          quality={100}
          priority
          sizes="(max-width: 720px) 190px, 250px"
          className={styles.brandBadgeImage}
        />
      </div>

      {!introFinished ? (
        <div className={styles.introOverlay}>
          <div className={`${styles.introLine} ${showIntroLine ? styles.introLineActive : ""}`} aria-hidden="true" />
        </div>
      ) : null}

      <PatientLogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={performLogout}
      />

      <header className={styles.topBar}>
        <PatientLandingNav
          items={LANDING_NAV_ITEMS}
          activeId={activeSectionId}
          onSelect={navigateSection}
        />

        <div className={styles.topBarActions}>
          <button type="button" aria-label="Perfil" title="Perfil">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 12H4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M20 4v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <main className={styles.hero}>
        <h1 className={styles.backgroundWord} aria-hidden="true">
          META IMAGEN
        </h1>

        <section className={styles.heroContent} id="servicios">
          <div className={styles.heroTextColumn}>
            <span className={styles.heroIntroBadge}>Portal del paciente Meta Imagen</span>
            <p className={styles.greeting}>Hola, {welcomeName}</p>
            <h2>
              Rehabilitacion y bienestar
              <span className={styles.heroHeadlineAccent}> con una experiencia digital clara, moderna y profesional.</span>
            </h2>
            <p className={styles.heroLead}>
              Explora tratamientos de fisioterapia y estetica, revisa detalles desde el carrusel 3D y agenda en
              clinica o a domicilio desde una sola interfaz.
            </p>
            <div className={styles.ctaRow}>
              <button
                type="button"
                className={styles.heroPrimaryButton}
                onClick={() => navigateSection("agenda")}
              >
                Agenda tu cita
              </button>
              <button
                type="button"
                className={styles.heroSecondaryButton}
                onClick={() => navigateSection("sobre-nosotros")}
              >
                Conocer Meta Imagen
              </button>
            </div>

            <div className={styles.heroStatsGrid}>
              {heroStats.map((item) => (
                <article key={item.label} className={styles.heroStatCard}>
                  <strong className={styles.heroStatValue}>{item.value}</strong>
                  <span className={styles.heroStatLabel}>{item.label}</span>
                </article>
              ))}
            </div>

            <div className={styles.heroSpotlightCard}>
              <div className={styles.heroSpotlightContent}>
                <span className={styles.heroSpotlightTag}>Atencion destacada</span>
                <strong>{featuredBranch?.nombre || "Meta Imagen"}</strong>
                <p>{featuredBranchSummary}</p>
                <small>{featuredBranchHours}</small>
              </div>
              <button
                type="button"
                className={styles.heroSecondaryButton}
                onClick={() => navigateSection("ubicacion")}
              >
                Ver ubicaciones
              </button>
            </div>

            <div className={styles.fluidText}>
              <div>
                <span>Rehabilitacion inteligente</span>
                <span>Estetica avanzada</span>
                <span>Movimiento que transforma</span>
                <span>Bienestar integral</span>
              </div>
            </div>
          </div>

          <div className={styles.heroRingsColumn}>
            <div className={styles.heroExperienceHeader}>
              <div className={styles.heroExperienceCopy}>
                <span className={styles.heroExperienceTag}>Explorador inmersivo</span>
                <h3>Carrusel 3D de tratamientos</h3>
                <p>Gira cada tarjeta, revisa beneficios, mira video y pasa tu seleccion a la agenda en segundos.</p>
              </div>
              <div className={styles.heroExperienceSelection}>
                <span>{agendaService ? "Seleccion actual" : "Siguiente paso"}</span>
                <strong>{agendaService ? agendaService.nombre : "Selecciona un servicio para llenar tu agenda"}</strong>
              </div>
            </div>

            <div className={styles.heroExperienceBody}>
              {!renderExperience ? <p className={styles.statusText}>Iniciando experiencia...</p> : null}
              {renderExperience && loading ? <p className={styles.statusText}>Cargando catalogo...</p> : null}
              {renderExperience && !loading && error ? <p className={styles.statusText}>{error}</p> : null}
              {renderExperience && !loading && !error ? (
                <PatientOrbitRings
                  fisioterapiaItems={grouped.fisioterapia}
                  esteticaItems={grouped.estetica}
                  enableVideoPlayback={renderExperience}
                  onSelectAgendaService={handleAgendaSelection}
                />
              ) : null}
            </div>
          </div>
        </section>

        <section id="agenda">
          <PatientAgendaSection token={agendaToken} preferredServiceId={agendaService?.id || null} />
        </section>

        <section id="ubicacion" className={`${styles.infoSection} ${styles.infoSectionPlain}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Ubicacion y contacto</span>
            <div>
              <h3>Espacios pensados para una experiencia serena y profesional</h3>
              <p className={styles.sectionLead}>
                Revisa horarios, ubicacion y redes oficiales de cada sucursal antes de programar tu visita.
              </p>
            </div>
          </div>
          {branches.length === 0 ? (
            <p className={styles.sectionFallback}>
              Estamos listos para atenderte en clinica y en modalidades segun disponibilidad de servicio.
            </p>
          ) : (
            <div className={styles.locationGrid}>
              {branches.map((branch) => {
                const hasDetailedSchedule = DAY_ORDER.some((day) => Boolean(branch.horarioDetalle[day]));
                const detailedDayRows = DAY_ORDER
                  .map((day) => ({ day, schedule: branch.horarioDetalle[day] }))
                  .filter((item) => Boolean(item.schedule));
                const socialLinks = [
                  {
                    key: "instagram",
                    icon: "/assets/social/instagram.svg",
                    label: "Instagram",
                    href: toSocialHref(branch.instagramUrl, "instagram"),
                  },
                  {
                    key: "facebook",
                    icon: "/assets/social/facebook.svg",
                    label: "Facebook",
                    href: toSocialHref(branch.facebookUrl, "facebook"),
                  },
                  {
                    key: "tiktok",
                    icon: "/assets/social/tiktok.svg",
                    label: "TikTok",
                    href: toSocialHref(branch.tiktokUrl, "tiktok"),
                  },
                  {
                    key: "whatsapp",
                    icon: "/assets/social/whatsapp.svg",
                    label: "WhatsApp",
                    href: toSocialHref(branch.whatsapp, "whatsapp"),
                  },
                ];

                return (
                  <article key={`branch-${branch.id ?? branch.nombre}`} className={styles.locationCard}>
                    <div className={styles.locationMedia}>
                      {branch.latitud !== null && branch.longitud !== null ? (
                        <PatientBranchLocationMap
                          branchName={branch.nombre || "Sucursal Meta Imagen"}
                          token={agendaToken}
                          latitude={branch.latitud}
                          longitude={branch.longitud}
                        />
                      ) : (
                        <div className={styles.locationMapFallback}>
                          <span className={styles.locationBadge}>Ubicacion en actualizacion</span>
                          <strong>{branch.nombre || "Sucursal"}</strong>
                          <p>Estamos afinando las coordenadas exactas de esta sucursal.</p>
                        </div>
                      )}
                    </div>

                    <div className={styles.locationBody}>
                      <div className={styles.locationIdentity}>
                        <span className={styles.locationBadge}>
                          {branch.activo ? "Atencion activa" : "Disponibilidad sujeta a agenda"}
                        </span>
                        <h4>{branch.nombre || "Sucursal"}</h4>
                        <p>{branch.direccion || "Direccion no registrada"}</p>
                      </div>
                      {branch.descripcion ? <p className={styles.locationDescription}>{branch.descripcion}</p> : null}

                      <div className={styles.locationMetaRow}>
                        {branch.telefono ? <span>Tel: {branch.telefono}</span> : null}
                        {branch.correo ? <span>{branch.correo}</span> : null}
                      </div>

                      <div className={styles.locationHoursBlock}>
                        <strong>Horarios</strong>
                        {hasDetailedSchedule ? (
                          <ul className={styles.locationHoursList}>
                            {detailedDayRows.map(({ day, schedule }) => (
                              <li key={`${branch.id ?? branch.nombre}-${day}`} className={styles.locationHoursItem}>
                                <span className={styles.locationDayLabel}>{DAY_LABELS[day]}</span>
                                <span className={styles.locationDayValue}>{buildDayText(schedule)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : branch.horario ? (
                          <p className={styles.locationHoursFallback}>{branch.horario}</p>
                        ) : (
                          <p className={styles.locationHoursFallback}>Horario por confirmar</p>
                        )}
                      </div>

                      <div className={styles.locationActionRow}>
                        <PatientBranchSocialCard branchName={branch.nombre || "Sucursal"} links={socialLinks} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="sobre-nosotros" className={styles.infoSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Sobre Meta Imagen</span>
            <div>
              <h3>Fisioterapia y estetica con un enfoque humano, preciso y contemporaneo</h3>
              <p className={styles.sectionLead}>
                Integramos tecnologia, acompanamiento profesional y experiencia de usuario para que cada paso se
                sienta claro, confiable y cercano.
              </p>
            </div>
          </div>

          <div className={styles.aboutGrid}>
            {CARE_PILLARS.map((pillar, index) => (
              <article key={pillar.title} className={styles.aboutCard}>
                <span className={styles.aboutCardIndex}>{`0${index + 1}`}</span>
                <h4>{pillar.title}</h4>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientLandingShell;
