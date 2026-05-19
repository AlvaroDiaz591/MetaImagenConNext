import styles from "../../styles/PatientLanding.module.css";
import type { PatientAppointmentSummary } from "../../../domain/entities/PatientAgenda";

type AgendaUpcomingAppointmentsProps = {
  appointments: PatientAppointmentSummary[];
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "Sin fecha";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status: string): string => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "confirmada") return "Confirmada";
  if (normalized === "cancelada") return "Cancelada";
  return "Pendiente";
};

const AgendaUpcomingAppointments = ({ appointments }: AgendaUpcomingAppointmentsProps) => {
  return (
    <aside className={styles.agendaAside}>
      <h4>Proximas citas</h4>

      {appointments.length === 0 ? (
        <p className={styles.agendaHintText}>Aun no tienes citas registradas.</p>
      ) : (
        <div className={styles.agendaAppointmentsList}>
          {appointments.slice(0, 6).map((appointment) => (
            <article key={`appointment-${appointment.id}`} className={styles.agendaAppointmentCard}>
              <div className={styles.agendaMetaRow}>
                <span>{statusLabel(appointment.estado)}</span>
                <span>{appointment.esDomicilio ? "Domicilio" : "Clinica"}</span>
              </div>
              <strong>{formatDate(appointment.scheduledAt)}</strong>
              <p>{appointment.tipo}</p>
              {appointment.personalNombre ? <small>Asignado: {appointment.personalNombre}</small> : null}
            </article>
          ))}
        </div>
      )}
    </aside>
  );
};

export default AgendaUpcomingAppointments;
