import type { AccionRapida } from "../../domain/entities/AdminDashboardSummary";
import styles from "../styles/AdminDashboard.module.css";

type AdminQuickActionsProps = {
  acciones: AccionRapida[];
};

const AdminQuickActions = ({ acciones }: AdminQuickActionsProps) => {
  return (
    <div className={styles.quickActionsGrid}>
      {acciones.map((accion) => (
        <article key={accion.id} className={styles.quickActionCard}>
          <h3>{accion.titulo}</h3>
          <p>{accion.descripcion}</p>
        </article>
      ))}
    </div>
  );
};

export default AdminQuickActions;