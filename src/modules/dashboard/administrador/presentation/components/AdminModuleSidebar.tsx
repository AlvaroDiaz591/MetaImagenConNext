import type { AdminModuleDefinition } from "../../domain/entities/AdminDashboardSummary";
import styles from "../styles/AdminDashboard.module.css";
import { PERSONAS_MODULE_IDS } from "../modules/moduleRegistry";
import { memo, useMemo, useState } from "react";

type AdminModuleSidebarProps = {
  modulos: AdminModuleDefinition[];
  seccionActiva: string;
  onSelectSection: (sectionId: string) => void;
};

const AdminModuleSidebar = ({ modulos, seccionActiva, onSelectSection }: AdminModuleSidebarProps) => {
  const [personasOpen, setPersonasOpen] = useState(true);

  const personasModulos = useMemo(
    () => modulos.filter((item) => PERSONAS_MODULE_IDS.includes(item.id)),
    [modulos],
  );

  const otherModulos = useMemo(
    () => modulos.filter((item) => !PERSONAS_MODULE_IDS.includes(item.id)),
    [modulos],
  );

  const renderItem = (modulo: AdminModuleDefinition) => {
    const active = modulo.id === seccionActiva;
    return (
      <button
        key={modulo.id}
        type="button"
        className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ""}`}
        onClick={() => onSelectSection(modulo.id)}
      >
        <span className={styles.sidebarDot} style={{ backgroundColor: modulo.color }} aria-hidden="true" />
        <span className={styles.sidebarTextWrap}>
          <span className={styles.sidebarText}>{modulo.titulo}</span>
          <span className={styles.sidebarMeta}>{modulo.totalRegistros.toLocaleString("es-BO")} registros</span>
        </span>
      </button>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <p className={styles.sidebarTitle}>Secciones</p>
      <div className={styles.sidebarList}>
        <div className={styles.sidebarGroup}>
          <button
            type="button"
            className={styles.sidebarGroupToggle}
            onClick={() => setPersonasOpen((current) => !current)}
          >
            <span>Gestion de Personas</span>
            <span>{personasOpen ? "Ocultar" : "Ver"}</span>
          </button>

          {personasOpen && <div className={styles.sidebarGroupContent}>{personasModulos.map(renderItem)}</div>}
        </div>

        {otherModulos.map(renderItem)}
      </div>
    </aside>
  );
};

export default memo(AdminModuleSidebar);
