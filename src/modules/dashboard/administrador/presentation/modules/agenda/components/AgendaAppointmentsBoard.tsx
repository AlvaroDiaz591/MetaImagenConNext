import { useMemo, useState } from "react";
import type {
  AdminAgendaAppointment,
  AgendaListRange,
  AgendaStatus,
} from "@/src/modules/dashboard/administrador/domain/entities/AdminAgenda";
import styles from "../styles/AdminAgendaSection.module.css";

type AgendaAppointmentsBoardProps = {
  appointments: AdminAgendaAppointment[];
  selectedRange: AgendaListRange;
  onRangeChange: (range: AgendaListRange) => void;
  statusFilter: AgendaStatus | "";
  onStatusFilterChange: (status: AgendaStatus | "") => void;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
  statusOptions: AgendaStatus[];
  changingStatusId: number | null;
  onChangeAppointmentStatus: (appointmentId: number, status: AgendaStatus) => void | Promise<void>;
  refreshingList: boolean;
};

const ranges: Array<{ id: AgendaListRange; label: string }> = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "personalizado", label: "Personalizado" },
];

const PAGE_SIZE = 10;

const formatAppointment = (value: string): string =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const statusLabel = (status: AgendaStatus): string => {
  switch (status) {
    case "confirmada":
      return "Confirmada";
    case "cancelada":
      return "Cancelada";
    default:
      return "Pendiente";
  }
};

const AgendaAppointmentsBoard = ({
  appointments,
  selectedRange,
  onRangeChange,
  statusFilter,
  onStatusFilterChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  statusOptions,
  changingStatusId,
  onChangeAppointmentStatus,
  refreshingList,
}: AgendaAppointmentsBoardProps) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleAppointments = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return appointments.slice(startIndex, startIndex + PAGE_SIZE);
  }, [appointments, safePage]);

  return (
    <article className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div>
          <h4>Listado de citas</h4>
          <p>Filtra por rango temporal, revisa estado y actualiza desde el mismo panel.</p>
        </div>
        {refreshingList ? <span className={styles.liveTag}>Actualizando...</span> : null}
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.chipWrap}>
          {ranges.map((range) => (
            <button
              key={range.id}
              type="button"
              className={selectedRange === range.id ? styles.choiceChipActive : styles.choiceChip}
              onClick={() => onRangeChange(range.id)}
              data-esp32-clickable="true"
            >
              {range.label}
            </button>
          ))}
        </div>

        <label className={styles.filterField}>
          Estado
          <select className={styles.inputCompact} value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as AgendaStatus | "") }>
            <option value="">Todos</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        {selectedRange === "personalizado" ? (
          <div className={styles.customRangeRow}>
            <label className={styles.filterField}>
              Desde
              <input type="date" className={styles.inputCompact} value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} />
            </label>
            <label className={styles.filterField}>
              Hasta
              <input type="date" className={styles.inputCompact} value={customTo} onChange={(event) => onCustomToChange(event.target.value)} />
            </label>
          </div>
        ) : null}
      </div>

      <div className={styles.appointmentList}>
        {visibleAppointments.map((appointment) => (
          <article key={appointment.id} className={styles.appointmentCard}>
            <div className={styles.appointmentMeta}>
              <span className={styles.statusPill} data-status={appointment.estado}>
                {statusLabel(appointment.estado)}
              </span>

              <div className={styles.appointmentIdentity}>
                <strong>{appointment.pacienteDisplay}</strong>
                <small>{appointment.tipo}</small>
              </div>
            </div>

            <div className={styles.appointmentBody}>
              <div className={styles.appointmentInfoBlock}>
                <span>{formatAppointment(appointment.scheduledAt)}</span>
                <small>{appointment.personalNombre || "Sin personal principal"}</small>
              </div>
              <div className={styles.appointmentInfoBlock}>
                <span>{appointment.duracionMinutos} min</span>
                <small>{appointment.esDomicilio ? "A domicilio" : "En clínica"}</small>
              </div>
            </div>

            {appointment.personalAsignado.length ? (
              <div className={styles.assignmentRow}>
                {appointment.personalAsignado.map((staff) => (
                  <span key={`${appointment.id}-${staff.personalId}`} className={styles.assignmentChip}>
                    {staff.displayName} · {staff.rol}
                  </span>
                ))}
              </div>
            ) : null}

            {appointment.notas ? <p className={styles.notesLine}>{appointment.notas}</p> : null}

            <div className={styles.statusActions}>
              {statusOptions.map((status) => (
                <button
                  key={`${appointment.id}-${status}`}
                  type="button"
                  className={appointment.estado === status ? styles.secondaryButtonActive : styles.secondaryButton}
                  data-status={status}
                  disabled={changingStatusId === appointment.id}
                  onClick={() => void onChangeAppointmentStatus(appointment.id, status)}
                  data-esp32-clickable="true"
                >
                  {changingStatusId === appointment.id && appointment.estado !== status ? "Guardando..." : statusLabel(status)}
                </button>
              ))}
            </div>
          </article>
        ))}
        {!appointments.length ? <p className={styles.emptyInline}>No hay citas para el rango seleccionado.</p> : null}
      </div>

      {appointments.length > PAGE_SIZE ? (
        <div className={styles.agendaPagination}>
          <span className={styles.paginationInfo}>
            Mostrando {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, appointments.length)} de {appointments.length} citas
          </span>

          <div className={styles.paginationActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1}>
              Anterior
            </button>
            <span className={styles.paginationInfo}>Página {safePage} de {totalPages}</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default AgendaAppointmentsBoard;
