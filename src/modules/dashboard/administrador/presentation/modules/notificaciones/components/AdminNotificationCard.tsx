import type { AdminNotificationItem } from "@/src/modules/dashboard/administrador/domain/entities/AdminNotification";
import styles from "../styles/AdminNotificationsSection.module.css";

type AdminNotificationCardProps = {
  notification: AdminNotificationItem;
  incoming: boolean;
  darkMode: boolean;
  marking: boolean;
  onMarkRead: (notificationId: number) => void | Promise<void>;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const AdminNotificationCard = ({ notification, incoming, darkMode, marking, onMarkRead }: AdminNotificationCardProps) => {
  return (
    <article
      className={`${styles.card} ${notification.visto ? styles.cardRead : styles.cardUnread} ${incoming ? styles.cardIncoming : ""}`}
      data-mode={darkMode ? "dark" : "light"}
      data-home-visit={notification.esDomicilio ? "true" : "false"}
    >
      <div className={styles.cardIcon}>
        <span>{notification.esDomicilio ? "DOM" : "CLN"}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardHeaderRow}>
              <h4>{notification.titulo}</h4>
              {!notification.visto ? <span className={styles.newBadge}>Nueva</span> : null}
            </div>
            <p>{notification.descripcion || "Sin descripcion adicional."}</p>
          </div>

          {!notification.visto ? (
            <button type="button" className={styles.markButton} onClick={() => void onMarkRead(notification.id)} disabled={marking}>
              {marking ? "Marcando..." : "Marcar leida"}
            </button>
          ) : (
            <span className={styles.readBadge}>Leida</span>
          )}
        </div>

        <div className={styles.cardMeta}>
          <span className={styles.metaChip}>{notification.esDomicilio ? "A domicilio" : "En clinica"}</span>
          <span className={styles.metaChip}>Cita: {formatDate(notification.fechaCita)}</span>
          {notification.pacienteNombre ? <span className={styles.metaChip}>{notification.pacienteNombre}</span> : null}
          <span className={styles.metaChip}>Creada: {formatDate(notification.createdAt)}</span>
        </div>
      </div>
    </article>
  );
};

export default AdminNotificationCard;
