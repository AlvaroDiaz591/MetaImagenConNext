import Image from "next/image";
import type { AgendaTab } from "@/src/modules/dashboard/administrador/domain/entities/AdminAgenda";
import styles from "../styles/AdminAgendaSection.module.css";

type AgendaHeroProps = {
  currentTab: AgendaTab;
  onTabChange: (tab: AgendaTab) => void;
  citasHoy: number;
  pendientesSemana: number;
  citasSemana: number;
};

const tabs: Array<{ id: AgendaTab; label: string; description: string }> = [
  { id: "agendar", label: "Agendar", description: "Crea nuevas citas con el flujo administrativo." },
  { id: "listado", label: "Listado", description: "Controla el estado de la agenda y filtra por rango." },
];

const AgendaHero = ({ currentTab, onTabChange, citasHoy, pendientesSemana, citasSemana }: AgendaHeroProps) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBackdrop}>
        <Image
          src="/assets/login/consu.jpg"
          alt="Meta Imagen"
          fill
          priority
          className={styles.heroImage}
          sizes="(max-width: 1200px) 100vw, 1100px"
        />
      </div>

      <div className={styles.heroContent}>
        <div className={styles.brandColumn}>
          <div className={styles.brandBadge}>
            <Image src="/assets/login/logo.png" alt="Meta Imagen" width={44} height={44} />
            <span>Meta Imagen</span>
          </div>

          <div>
            <p className={styles.eyebrow}>Agenda clínica</p>
            <h3 className={styles.heroTitle}>Agenda y citas con el mismo flujo de trabajo clínico, ahora en Next y Django.</h3>
            <p className={styles.heroCopy}>
              Centraliza pacientes, tratamientos, personal asignado y seguimiento del estado en una vista pensada
              para administración diaria.
            </p>
          </div>
        </div>

        <div className={styles.metricGrid}>
          <article className={styles.metricCard}>
            <strong>{citasHoy}</strong>
            <span>Citas hoy</span>
          </article>
          <article className={styles.metricCard}>
            <strong>{pendientesSemana}</strong>
            <span>Pendientes semana</span>
          </article>
          <article className={styles.metricCard}>
            <strong>{citasSemana}</strong>
            <span>Citas semana</span>
          </article>
        </div>

        <div className={styles.tabRail}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={currentTab === tab.id ? styles.tabButtonActive : styles.tabButton}
              onClick={() => onTabChange(tab.id)}
              data-esp32-clickable="true"
            >
              <span>{tab.label}</span>
              <small>{tab.description}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgendaHero;
