"use client";

import styles from "../../styles/PatientLanding.module.css";
import { usePatientAgenda } from "../../hooks/usePatientAgenda";
import AgendaModeToggle from "./AgendaModeToggle";
import AgendaDateTimePicker from "./AgendaDateTimePicker";
import AgendaServicePicker from "./AgendaServicePicker";
import AgendaClinicFields from "./AgendaClinicFields";
import AgendaHomeVisitFields from "./AgendaHomeVisitFields";
import AgendaUpcomingAppointments from "./AgendaUpcomingAppointments";

type PatientAgendaSectionProps = {
  token: string;
  preferredServiceId: number | null;
};

const PatientAgendaSection = ({ token, preferredServiceId }: PatientAgendaSectionProps) => {
  const agenda = usePatientAgenda({ token, preferredServiceId });

  if (agenda.loading) {
    return (
      <section className={styles.agendaSection}>
        <header className={styles.agendaHeading}>
          <h3>Agenda tu cita</h3>
          <p>Sincronizando horarios y reglas de disponibilidad...</p>
        </header>
      </section>
    );
  }

  return (
    <section className={styles.agendaSection}>
      <header className={styles.agendaHeading}>
        <h3>Agenda tu cita</h3>
        <p>
          Programa tu atencion en clinica o a domicilio con validaciones de disponibilidad y geocerca activa.
        </p>
      </header>

      <div className={styles.agendaLayout}>
        <div className={styles.agendaMain}>
          <AgendaModeToggle
            mode={agenda.mode}
            homeModeEnabled={agenda.homeModeEnabled}
            onChangeMode={(next) => {
              void agenda.handleChangeMode(next);
            }}
          />

          <AgendaDateTimePicker
            selectedDate={agenda.selectedDate}
            selectedTime={agenda.selectedTime}
            slots={agenda.slots}
            slotsLoading={agenda.slotsLoading}
            slotsError={agenda.slotsError}
            onChangeDate={(nextDate) => {
              void agenda.handleDateChange(nextDate);
            }}
            onChangeTime={agenda.setSelectedTime}
          />

          <AgendaServicePicker
            services={agenda.servicesForMode}
            selectedServiceId={agenda.selectedServiceId}
            selectedService={agenda.selectedService}
            onSelectService={agenda.setSelectedServiceId}
          />

          {agenda.mode === "clinic" ? (
            <AgendaClinicFields
              branches={agenda.branches}
              selectedBranchId={agenda.selectedBranchId}
              onChangeBranchId={agenda.setSelectedBranchId}
            />
          ) : (
            <AgendaHomeVisitFields
              selectedBranch={agenda.selectedBranch}
              limit={agenda.limit}
              domicilioDireccion={agenda.domicilioDireccion}
              domicilioReferencia={agenda.domicilioReferencia}
              homePoint={agenda.homePoint}
              homeInsideLimit={agenda.homeInsideLimit}
              geolocationError={agenda.geolocationError}
              addressLookupError={agenda.addressLookupError}
              locating={agenda.locating}
              resolvingAddress={agenda.resolvingAddress}
              routeLoading={agenda.routeLoading}
              routeError={agenda.routeError}
              routeResult={agenda.routeResult}
              onChangeDireccion={agenda.setDomicilioDireccion}
              onChangeReferencia={agenda.setDomicilioReferencia}
              onUseCurrentLocation={agenda.useCurrentLocation}
              onClearHomeSelection={agenda.clearHomeSelection}
              onCalculateRoute={() => {
                void agenda.calculateRoute();
              }}
              onPickPointFromMap={(point) => {
                agenda.handleHomePoint(point);
              }}
            />
          )}

          <label className={styles.agendaField}>
            <span>Notas opcionales para el equipo</span>
            <textarea
              rows={3}
              value={agenda.notes}
              onChange={(event) => agenda.setNotes(event.target.value)}
              placeholder="Ej. sensibilidad en piel, horario de preferencia, etc."
            />
          </label>

          {agenda.error ? <p className={styles.agendaErrorText}>{agenda.error}</p> : null}
          {agenda.submitError ? <p className={styles.agendaErrorText}>{agenda.submitError}</p> : null}
          {agenda.successMessage ? <p className={styles.agendaSuccessText}>{agenda.successMessage}</p> : null}

          <div className={styles.agendaActionsRow}>
            <button type="button" onClick={() => void agenda.refresh()}>
              Recargar
            </button>
            <button type="button" onClick={() => void agenda.submit()} disabled={agenda.saving}>
              {agenda.saving ? "Registrando cita..." : "Confirmar cita"}
            </button>
          </div>
        </div>

        <AgendaUpcomingAppointments appointments={agenda.appointments} />
      </div>
    </section>
  );
};

export default PatientAgendaSection;
