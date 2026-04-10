import type { AccesoReciente } from "../../domain/entities/AdminDashboardSummary";
import styles from "../styles/AdminDashboard.module.css";

type AdminRecentAccessListProps = {
  accesos: AccesoReciente[];
};

const AdminRecentAccessList = ({ accesos }: AdminRecentAccessListProps) => {
  if (accesos.length === 0) {
    return <p className={styles.emptyText}>Aun no hay actividad reciente.</p>;
  }

  return (
    <div className={styles.listWrapper}>
      {accesos.map((acceso) => (
        <article key={`${acceso.id}-${acceso.fecha}`} className={styles.listItem}>
          <div>
            <p className={styles.listName}>{acceso.nombre}</p>
            <p className={styles.listSub}>{acceso.correoElectronico}</p>
          </div>
          <div className={styles.listMeta}>
            <p>{acceso.evento === "inicio_sesion" ? "Inicio de sesion" : "Registro"}</p>
            <p>{new Date(acceso.fecha).toLocaleString("es-BO")}</p>
            <span className={styles.roleTag}>{acceso.rol}</span>
          </div>
        </article>
      ))}
    </div>
  );
};

export default AdminRecentAccessList;