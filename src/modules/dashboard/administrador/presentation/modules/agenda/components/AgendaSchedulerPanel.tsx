import type {
  AdminAgendaAppointment,
  AdminAgendaPatient,
  AdminAgendaServiceItem,
  AdminAgendaStaff,
} from "@/src/modules/dashboard/administrador/domain/entities/AdminAgenda";
import styles from "../styles/AdminAgendaSection.module.css";

type AgendaSchedulerPanelProps = {
  patientQuery: string;
  onPatientQueryChange: (value: string) => void;
  patientResults: AdminAgendaPatient[];
  selectedPatient: AdminAgendaPatient | null;
  patientAppointments: AdminAgendaAppointment[];
  onSelectPatient: (patient: AdminAgendaPatient) => void | Promise<void>;
  searchingPatients: boolean;
  selectedDate: string;
  onSelectedDateChange: (value: string) => void;
  selectedTime: string;
  onSelectedTimeChange: (value: string) => void;
  services: AdminAgendaServiceItem[];
  selectedServiceId: number | null;
  onSelectedServiceIdChange: (value: number | null) => void;
  manualType: string;
  onManualTypeChange: (value: string) => void;
  tipoPresets: string[];
  activeStaff: AdminAgendaStaff[];
  selectedStaff: Array<{ personalId: number; rol: string }>;
  onToggleStaff: (personalId: number) => void;
  onUpdateStaffRole: (personalId: number, rol: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  saving: boolean;
  onSubmit: () => void | Promise<boolean>;
};

const formatAppointment = (value: string): string => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const AgendaSchedulerPanel = ({
  patientQuery,
  onPatientQueryChange,
  patientResults,
  selectedPatient,
  patientAppointments,
  onSelectPatient,
  searchingPatients,
  selectedDate,
  onSelectedDateChange,
  selectedTime,
  onSelectedTimeChange,
  services,
  selectedServiceId,
  onSelectedServiceIdChange,
  manualType,
  onManualTypeChange,
  tipoPresets,
  activeStaff,
  selectedStaff,
  onToggleStaff,
  onUpdateStaffRole,
  notes,
  onNotesChange,
  saving,
  onSubmit,
}: AgendaSchedulerPanelProps) => {
  return (
    <section className={styles.schedulerGrid}>
      <article className={styles.panelCard}>
        <div className={styles.panelHead}>
          <div>
            <h4>Selecciona paciente</h4>
            <p>Busca por nombre o código y revisa sus citas al instante.</p>
          </div>
          {searchingPatients ? <span className={styles.liveTag}>Buscando...</span> : null}
        </div>

        <label className={styles.fieldLabel}>
          Paciente
          <input
            type="text"
            className={styles.input}
            value={patientQuery}
            onChange={(event) => onPatientQueryChange(event.target.value)}
            placeholder="Nombre o código de paciente"
          />
        </label>

        <div className={styles.patientResults}>
          {patientResults.map((patient) => (
            <button
              key={patient.id}
              type="button"
              className={selectedPatient?.id === patient.id ? styles.patientOptionActive : styles.patientOption}
              onClick={() => onSelectPatient(patient)}
              data-esp32-clickable="true"
            >
              <strong>{patient.fullName}</strong>
              <span>{patient.codigo || "Sin código"}</span>
              <small>{patient.telefono || "Sin teléfono"}</small>
            </button>
          ))}
          {!patientResults.length ? <p className={styles.emptyInline}>No se encontraron pacientes para esa búsqueda.</p> : null}
        </div>

        <div className={styles.patientDetailCard}>
          <div>
            <span className={styles.sectionKicker}>Paciente activo</span>
            <h5>{selectedPatient?.fullName || "Aún no seleccionaste un paciente"}</h5>
            <p>{selectedPatient?.codigo ? `Código ${selectedPatient.codigo}` : "Selecciona un paciente para habilitar el formulario."}</p>
          </div>

          <div className={styles.miniTimeline}>
            {patientAppointments.slice(0, 5).map((appointment) => (
              <article key={appointment.id} className={styles.timelineItem}>
                <strong>{appointment.tipo}</strong>
                <span>{formatAppointment(appointment.scheduledAt)}</span>
                <small>{appointment.estado}</small>
              </article>
            ))}
            {!patientAppointments.length ? <p className={styles.emptyInline}>Sin citas registradas para este paciente.</p> : null}
          </div>
        </div>
      </article>

      <article className={styles.panelCard}>
        <div className={styles.panelHead}>
          <div>
            <h4>Detalles de la cita</h4>
            <p>Replica el flujo clínico: servicio, tipo, personal asignado y notas.</p>
          </div>
          <span className={styles.liveTag}>Administración</span>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Fecha
            <input type="date" className={styles.input} value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} />
          </label>
          <label className={styles.fieldLabel}>
            Hora
            <input type="time" className={styles.input} value={selectedTime} onChange={(event) => onSelectedTimeChange(event.target.value)} />
          </label>
        </div>

        <label className={styles.fieldLabel}>
          Servicio
          <select
            className={styles.input}
            value={selectedServiceId ?? ""}
            onChange={(event) => onSelectedServiceIdChange(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">Selecciona un servicio</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nombre} · {service.duracionMinutos} min
              </option>
            ))}
          </select>
        </label>

        <div className={styles.chipWrap}>
          {tipoPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={manualType.trim().toLowerCase() === preset.toLowerCase() ? styles.choiceChipActive : styles.choiceChip}
              onClick={() => onManualTypeChange(preset)}
              data-esp32-clickable="true"
            >
              {preset}
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel}>
          Tipo manual
          <input
            type="text"
            className={styles.input}
            value={manualType}
            onChange={(event) => onManualTypeChange(event.target.value)}
            placeholder="Consulta, control, procedimiento o servicio personalizado"
          />
        </label>

        <div className={styles.staffGrid}>
          {activeStaff.map((staff) => {
            const selected = selectedStaff.find((item) => item.personalId === staff.id) || null;
            return (
              <article key={staff.id} className={selected ? styles.staffCardActive : styles.staffCard}>
                <label className={styles.staffToggle}>
                  <input type="checkbox" checked={Boolean(selected)} onChange={() => onToggleStaff(staff.id)} />
                  <span>
                    <strong>{staff.displayName}</strong>
                    <small>{staff.rol}</small>
                  </span>
                </label>

                {selected ? (
                  <input
                    type="text"
                    className={styles.inputCompact}
                    value={selected.rol}
                    onChange={(event) => onUpdateStaffRole(staff.id, event.target.value)}
                    placeholder="Rol opcional en la cita"
                  />
                ) : null}
              </article>
            );
          })}
        </div>

        <label className={styles.fieldLabel}>
          Notas
          <textarea
            className={styles.textarea}
            rows={5}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Indicaciones previas, observaciones o detalles logísticos"
          />
        </label>

        <button type="button" className={styles.primaryButton} onClick={() => void onSubmit()} disabled={saving} data-esp32-clickable="true">
          {saving ? "Guardando cita..." : "Agendar cita"}
        </button>
      </article>
    </section>
  );
};

export default AgendaSchedulerPanel;
