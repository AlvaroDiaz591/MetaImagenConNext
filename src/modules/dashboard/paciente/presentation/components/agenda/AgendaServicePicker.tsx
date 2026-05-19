import styles from "../../styles/PatientLanding.module.css";
import type { AgendaService } from "../../../domain/entities/PatientAgenda";

type AgendaServicePickerProps = {
  services: AgendaService[];
  selectedServiceId: number | null;
  selectedService: AgendaService | null;
  onSelectService: (serviceId: number | null) => void;
};

const AgendaServicePicker = ({
  services,
  selectedServiceId,
  selectedService,
  onSelectService,
}: AgendaServicePickerProps) => {
  return (
    <div className={styles.agendaServiceBlock}>
      <div className={styles.agendaServiceHeader}>
        <h4>Tratamiento o servicio</h4>
        {selectedService ? (
          <button type="button" onClick={() => onSelectService(null)}>
            Quitar seleccionado
          </button>
        ) : null}
      </div>

      {services.length === 0 ? (
        <p className={styles.agendaHintText}>Aun no hay servicios disponibles para esta modalidad.</p>
      ) : (
        <div className={styles.agendaChipWrap}>
          {services.slice(0, 14).map((service) => (
            <button
              key={service.id}
              type="button"
              className={`${styles.agendaChipButton} ${selectedServiceId === service.id ? styles.agendaChipButtonActive : ""}`}
              onClick={() => onSelectService(selectedServiceId === service.id ? null : service.id)}
            >
              {service.nombre}
            </button>
          ))}
        </div>
      )}

      {selectedService ? (
        <article className={styles.agendaServicePreview}>
          <h5>{selectedService.nombre}</h5>
          <p>{selectedService.descripcion}</p>
          <div className={styles.agendaMetaRow}>
            <span>{selectedService.categoria}</span>
            <span>
              {selectedService.precio === null ? "Precio por evaluar" : `${selectedService.precio.toFixed(2)} BOB`}
            </span>
            <span>
              {selectedService.duracionMinutos === null || selectedService.duracionMinutos <= 0
                ? "Duracion flexible"
                : `${selectedService.duracionMinutos} min`}
            </span>
          </div>
        </article>
      ) : null}
    </div>
  );
};

export default AgendaServicePicker;
