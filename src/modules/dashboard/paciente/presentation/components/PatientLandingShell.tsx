"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GetPatientLandingCatalogUseCase } from "../../application/usecases/GetPatientLandingCatalogUseCase";
import type { PatientLandingCatalog, PatientLandingServiceItem } from "../../domain/entities/PatientLandingCatalog";
import { PatientLandingCatalogApiAdapter } from "../../infrastructure/api/PatientLandingCatalogApiAdapter";
import PatientOrbitRings from "./PatientOrbitRings";
import type { AgendaServiceSelection } from "./PatientOrbitRings";
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

  const landingUseCase = useMemo(
    () => new GetPatientLandingCatalogUseCase(new PatientLandingCatalogApiAdapter()),
    [],
  );

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("meta_imagen_token");
    window.sessionStorage.removeItem("meta_imagen_token");
    window.localStorage.removeItem("meta_imagen_usuario");
    window.sessionStorage.removeItem("meta_imagen_usuario");
    window.localStorage.removeItem("meta_imagen_rol");
    window.sessionStorage.removeItem("meta_imagen_rol");
    router.replace("/login");
  }, [router]);

  const navigateSection = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAgendaSelection = useCallback((service: AgendaServiceSelection) => {
    setAgendaService(service);
  }, []);

  const openAgendaWhatsapp = useCallback(() => {
    if (!agendaService) {
      return;
    }

    const message = [
      "Hola, quiero agendar una cita.",
      `Servicio: ${agendaService.nombre}`,
      `Categoria: ${agendaService.categoria}`,
      `Precio referencial: ${formatPrice(agendaService.precio)}`,
      `Duracion estimada: ${formatDuration(agendaService.duracionMinutos)}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [agendaService]);

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
          handleLogout();
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
  }, [handleLogout, landingUseCase, router]);

  const grouped = useMemo(() => {
    const services = catalog?.servicios || [];
    return groupServices(services);
  }, [catalog?.servicios]);

  const welcomeName = catalog?.nombreVisible || "Paciente";

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

      <header className={styles.topBar}>
        <nav className={styles.mainNav}>
          <button type="button" onClick={() => navigateSection("agenda")}>Agenda tu Cita</button>
          <button type="button" onClick={() => navigateSection("servicios")}>Servicios</button>
          <button type="button" onClick={() => navigateSection("ubicacion")}>Ubicacion</button>
          <button type="button" onClick={() => navigateSection("sobre-nosotros")}>Sobre Nosotros</button>
        </nav>

        <div className={styles.topBarActions}>
          <button type="button" aria-label="Perfil" title="Perfil">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" aria-label="Cerrar sesion" title="Cerrar sesion" onClick={handleLogout}>
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
            <p className={styles.greeting}>Hola, {welcomeName}</p>
            <h2>Experiencia inmersiva de tratamientos y servicios</h2>
            <p>
              Explora nuestros servicios en carruseles 3D separados por especialidad. Cada tarjeta muestra imagen,
              video y al presionarla gira para revelar su descripcion completa.
            </p>
            <div className={styles.ctaRow}>
              <button type="button" onClick={() => navigateSection("agenda")}>Agenda tu cita</button>
              <button type="button" onClick={() => navigateSection("sobre-nosotros")}>Conocer Meta Imagen</button>
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
        </section>

        <section id="agenda" className={styles.infoSection}>
          <h3>Agenda tu Cita</h3>
          {agendaService ? (
            <div className={styles.agendaServiceCard}>
              <p className={styles.agendaServiceTag}>Servicio seleccionado</p>
              <h4>{agendaService.nombre}</h4>
              <p className={styles.agendaServiceDescription}>{agendaService.descripcion}</p>
              <div className={styles.agendaServiceMeta}>
                <span>{agendaService.categoria}</span>
                <span>{formatPrice(agendaService.precio)}</span>
                <span>{formatDuration(agendaService.duracionMinutos)}</span>
              </div>
              <button type="button" onClick={openAgendaWhatsapp}>Agendar este servicio</button>
            </div>
          ) : (
            <p>Selecciona un servicio desde una tarjeta para agendarlo aqui con sus detalles.</p>
          )}
        </section>

        <section id="ubicacion" className={styles.infoSection}>
          <h3>Ubicacion</h3>
          <p>Estamos listos para atenderte en clinica y en modalidades segun disponibilidad de servicio.</p>
        </section>

        <section id="sobre-nosotros" className={styles.infoSection}>
          <h3>Sobre Nosotros</h3>
          <p>
            Meta Imagen integra fisioterapia y estetica con un enfoque humano, tecnologico y centrado en
            resultados reales para cada paciente.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PatientLandingShell;
