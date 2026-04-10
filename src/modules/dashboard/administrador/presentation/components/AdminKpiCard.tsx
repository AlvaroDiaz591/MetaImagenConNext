import type { AdminKpi } from "../../domain/entities/AdminDashboardSummary";
import styles from "../styles/AdminDashboard.module.css";

type AdminKpiCardProps = {
  item: AdminKpi;
};

const AdminKpiCard = ({ item }: AdminKpiCardProps) => {
  return (
    <article className={styles.kpiCard}>
      <p className={styles.kpiTitle}>{item.titulo}</p>
      <p className={styles.kpiValue}>{item.valor.toLocaleString("es-BO")}</p>
      <p className={styles.kpiDescription}>{item.descripcion}</p>
    </article>
  );
};

export default AdminKpiCard;