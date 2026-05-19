"use client";

import type { AdminNotificationFilter } from "@/src/modules/dashboard/administrador/domain/entities/AdminNotification";
import { useAdminNotificationsModule } from "../hooks/useAdminNotificationsModule";
import AdminNotificationCard from "./AdminNotificationCard";
import styles from "../styles/AdminNotificationsSection.module.css";

type AdminNotificationsSectionProps = {
  active: boolean;
  token: string;
  themeMode: "dark" | "light";
  onSummaryChange?: (summary: { total: number; noLeidas: number }) => void;
};

const filters: Array<{ id: AdminNotificationFilter; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "no_leidas", label: "No leidas" },
  { id: "leidas", label: "Leidas" },
];

const AdminNotificationsSection = ({ active, token, themeMode, onSummaryChange }: AdminNotificationsSectionProps) => {
  const notifications = useAdminNotificationsModule({ active, token, onSummaryChange });
  const isDark = themeMode === "dark";

  if (notifications.loading) {
    return <div className={styles.statusScreen}>Cargando notificaciones...</div>;
  }

  return (
    <section className={`${styles.sectionWrap} ${isDark ? styles.sectionWrapDark : styles.sectionWrapLight}`}>
      <article className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Centro de alertas</span>
          <h3>Notificaciones recientes con el mismo enfoque visual del panel Flutter.</h3>
          <p>Controla alertas nuevas, filtra por lectura y mantente sincronizado con actualizacion automatica.</p>
        </div>

        <div className={styles.metricStrip}>
          <article className={styles.metricCard}>
            <strong>{notifications.summary.total}</strong>
            <span>Total</span>
          </article>
          <article className={styles.metricCard}>
            <strong>{notifications.summary.noLeidas}</strong>
            <span>Sin leer</span>
          </article>
          <article className={styles.metricCard}>
            <strong>{notifications.summary.leidas}</strong>
            <span>Leidas</span>
          </article>
        </div>
      </article>

      {notifications.message ? <div className={styles.messageSuccess}>{notifications.message}</div> : null}
      {notifications.error ? <div className={styles.messageError}>{notifications.error}</div> : null}

      <article className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div>
            <h4>Notificaciones recientes</h4>
            <p>Las nuevas alertas se resaltan automaticamente cuando llegan al panel.</p>
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.softButton} onClick={() => void notifications.refresh()} disabled={notifications.refreshing}>
              {notifications.refreshing ? "Actualizando..." : "Actualizar"}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void notifications.markAllRead()}
              disabled={notifications.markingAll || notifications.summary.noLeidas <= 0}
            >
              {notifications.markingAll ? "Marcando..." : "Marcar todas"}
            </button>
          </div>
        </div>

        <div className={styles.toolbarRow}>
          <label className={styles.searchField}>
            Buscar
            <input
              type="search"
              className={styles.searchInput}
              value={notifications.search}
              onChange={(event) => {
                notifications.setSearch(event.target.value);
                notifications.setPage(1);
              }}
              placeholder="Paciente, tipo o texto de la alerta"
            />
          </label>

          <div className={styles.filterRail}>
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={notifications.filter === item.id ? styles.filterChipActive : styles.filterChip}
                onClick={() => {
                  notifications.setFilter(item.id);
                  notifications.setPage(1);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.resultsBar}>
          <span>{notifications.summary.total} notificaciones registradas</span>
          <span>Pagina {notifications.page} de {notifications.totalPages}</span>
        </div>

        <div className={styles.listWrap}>
          {notifications.notifications.map((item) => (
            <AdminNotificationCard
              key={item.id}
              notification={item}
              darkMode={isDark}
              incoming={notifications.incomingIds.includes(item.id)}
              marking={notifications.markingId === item.id}
              onMarkRead={notifications.markRead}
            />
          ))}

          {!notifications.notifications.length ? (
            <div className={styles.emptyState}>
              <strong>No hay notificaciones para este filtro.</strong>
              <p>Prueba con otra busqueda o cambia entre todas, no leidas y leidas.</p>
            </div>
          ) : null}
        </div>

        <div className={styles.paginationBar}>
          <button type="button" className={styles.paginationButton} onClick={() => notifications.setPage(Math.max(1, notifications.page - 1))} disabled={notifications.page <= 1}>
            Anterior
          </button>
          <span>Mostrando pagina {notifications.page} de {notifications.totalPages}</span>
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => notifications.setPage(Math.min(notifications.totalPages, notifications.page + 1))}
            disabled={notifications.page >= notifications.totalPages}
          >
            Siguiente
          </button>
        </div>
      </article>
    </section>
  );
};

export default AdminNotificationsSection;
