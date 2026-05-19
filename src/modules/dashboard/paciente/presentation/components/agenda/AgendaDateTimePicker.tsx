import styles from "../../styles/PatientLanding.module.css";
import type { SlotsResponse } from "../../../domain/entities/PatientAgenda";

type AgendaDateTimePickerProps = {
  selectedDate: string;
  selectedTime: string | null;
  slots: SlotsResponse | null;
  slotsLoading: boolean;
  slotsError: string;
  onChangeDate: (value: string) => void;
  onChangeTime: (value: string) => void;
};

const AgendaDateTimePicker = ({
  selectedDate,
  selectedTime,
  slots,
  slotsLoading,
  slotsError,
  onChangeDate,
  onChangeTime,
}: AgendaDateTimePickerProps) => {
  const availableCount = (slots?.slots || []).filter((slot) => slot.available && slot.remaining > 0).length;

  return (
    <div className={styles.agendaDateTimeGrid}>
      <label className={styles.agendaField}>
        <span>Fecha</span>
        <input type="date" value={selectedDate} onChange={(event) => onChangeDate(event.target.value)} />
      </label>

      <label className={styles.agendaField}>
        <span>Horario</span>
        <select
          value={selectedTime || ""}
          onChange={(event) => onChangeTime(event.target.value)}
          disabled={slotsLoading}
        >
          <option value="">{slotsLoading ? "Consultando horarios..." : "Selecciona un horario"}</option>
          {(slots?.slots || []).map((slot) => (
            <option key={`${slot.time}-${slot.startsAt}`} value={slot.time} disabled={!slot.available || slot.remaining <= 0}>
              {slot.time} {slot.available ? `- ${slot.remaining} cupos` : "- sin cupos"}
            </option>
          ))}
        </select>
      </label>

      <p className={styles.agendaHintText}>
        {slotsLoading
          ? "Consultando disponibilidad..."
          : availableCount > 0
            ? `Horarios disponibles: ${availableCount}`
            : "No hay horarios disponibles para esta fecha."}
      </p>

      {slotsError ? <p className={styles.agendaErrorText}>{slotsError}</p> : null}
    </div>
  );
};

export default AgendaDateTimePicker;
