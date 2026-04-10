import { memo } from "react";
import styles from "../styles/AdminDashboard.module.css";

type AdminPortalToolbarProps = {
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  totalRegistros: number;
  mensajeVista: string;
  updatingData?: boolean;
  unreadNotifications?: number;
  onMarkAllNotificationsRead?: () => void;
  markingAllNotifications?: boolean;
  isNotificationsSection?: boolean;
};

const AdminPortalToolbar = ({
  busqueda,
  onBusquedaChange,
  totalRegistros,
  mensajeVista,
  updatingData = false,
  unreadNotifications = 0,
  onMarkAllNotificationsRead,
  markingAllNotifications = false,
  isNotificationsSection = false,
}: AdminPortalToolbarProps) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <input
          className={styles.searchInput}
          type="search"
          value={busqueda}
          onChange={(event) => onBusquedaChange(event.target.value)}
          placeholder="Buscar por nombre, correo, rol, estado..."
        />
        <p className={styles.toolbarHint}>{mensajeVista}</p>
      </div>
      <div className={styles.toolbarRight}>
        {isNotificationsSection ? (
          <div className={styles.notificationSummaryBlock}>
            <span className={styles.notificationCounter}>{unreadNotifications} sin leer</span>
            <button
              type="button"
              className={styles.markAllButton}
              onClick={onMarkAllNotificationsRead}
              disabled={!onMarkAllNotificationsRead || markingAllNotifications || unreadNotifications <= 0}
            >
              {markingAllNotifications ? "Marcando..." : "Marcar todas"}
            </button>
          </div>
        ) : null}
        {updatingData ? <span className={styles.subtleUpdating}>Actualizando...</span> : null}
        <p className={styles.toolbarTotal}>{totalRegistros.toLocaleString("es-BO")} resultados</p>
      </div>
    </div>
  );
};

export default memo(AdminPortalToolbar);
