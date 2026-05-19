import React from "react";
import styles from "../../styles/PatientLanding.module.css";

type PatientLandingNavItem = {
  id: string;
  label: string;
};

type PatientLandingNavProps = {
  items: PatientLandingNavItem[];
  activeId: string;
  onSelect: (sectionId: string) => void;
};

const PatientLandingNav = ({ items, activeId, onSelect }: PatientLandingNavProps) => {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );

  return (
    <nav
      className={styles.mainNav}
      aria-label="Secciones de la landing del paciente"
      data-active-index={activeIndex}
      style={{
        ["--glass-glider-count" as string]: String(items.length),
      }}
    >
      <span
        className={styles.glassGlider}
        aria-hidden="true"
        style={{ ["--glass-glider-index" as string]: String(activeIndex) }}
      />

      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.glassNavButton} ${isActive ? styles.glassNavButtonActive : ""}`}
            onClick={() => onSelect(item.id)}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export type { PatientLandingNavItem };
export default PatientLandingNav;
