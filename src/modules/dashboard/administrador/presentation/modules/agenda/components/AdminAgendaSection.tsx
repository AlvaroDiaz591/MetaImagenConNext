"use client";

import AgendaAppointmentsBoard from "./AgendaAppointmentsBoard";
import AgendaHero from "./AgendaHero";
import AgendaSchedulerPanel from "./AgendaSchedulerPanel";
import styles from "../styles/AdminAgendaSection.module.css";
import { useAdminAgendaModule } from "../hooks/useAdminAgendaModule";

type AdminAgendaSectionProps = {
  active: boolean;
  token: string;
  themeMode: "dark" | "light";
};

const AdminAgendaSection = ({ active, token, themeMode }: AdminAgendaSectionProps) => {
  const agenda = useAdminAgendaModule({ active, token });

  if (agenda.loading) {
    return <div className={styles.statusScreen}>Cargando agenda clínica...</div>;
  }

  if (agenda.error && !agenda.bootstrap) {
    return <div className={styles.statusScreen}>{agenda.error}</div>;
  }

  const summary = agenda.bootstrap?.resumen;

  return (
    <section className={`${styles.sectionWrap} ${themeMode === "dark" ? styles.sectionWrapDark : styles.sectionWrapLight}`}>
      <AgendaHero
        currentTab={agenda.tab}
        onTabChange={agenda.setTab}
        citasHoy={summary?.citasHoy || 0}
        pendientesSemana={summary?.pendientesSemana || 0}
        citasSemana={summary?.citasSemana || 0}
      />

      {agenda.message ? <div className={styles.messageSuccess}>{agenda.message}</div> : null}
      {agenda.error ? <div className={styles.messageError}>{agenda.error}</div> : null}

      {agenda.tab === "agendar" || agenda.tab === "pacientes" ? (
        <AgendaSchedulerPanel
          patientQuery={agenda.patientQuery}
          onPatientQueryChange={agenda.setPatientQuery}
          patientResults={agenda.patientResults}
          selectedPatient={agenda.selectedPatient}
          patientAppointments={agenda.patientAppointments}
          onSelectPatient={agenda.selectPatient}
          searchingPatients={agenda.searchingPatients}
          selectedDate={agenda.selectedDate}
          onSelectedDateChange={agenda.setSelectedDate}
          selectedTime={agenda.selectedTime}
          onSelectedTimeChange={agenda.setSelectedTime}
          services={agenda.activeServices}
          selectedServiceId={agenda.selectedServiceId}
          onSelectedServiceIdChange={agenda.setSelectedServiceId}
          manualType={agenda.manualType}
          onManualTypeChange={agenda.setManualType}
          tipoPresets={agenda.tipoPresets}
          activeStaff={agenda.activeStaff}
          selectedStaff={agenda.selectedStaff}
          onToggleStaff={agenda.toggleStaff}
          onUpdateStaffRole={agenda.updateStaffRole}
          notes={agenda.notes}
          onNotesChange={agenda.setNotes}
          saving={agenda.saving}
          onSubmit={agenda.submitAppointment}
        />
      ) : null}

      {agenda.tab === "listado" ? (
        <AgendaAppointmentsBoard
          key={`${agenda.listRange}-${agenda.statusFilter}-${agenda.customFrom}-${agenda.customTo}`}
          appointments={agenda.appointments}
          selectedRange={agenda.listRange}
          onRangeChange={agenda.setListRange}
          statusFilter={agenda.statusFilter}
          onStatusFilterChange={agenda.setStatusFilter}
          customFrom={agenda.customFrom}
          onCustomFromChange={agenda.setCustomFrom}
          customTo={agenda.customTo}
          onCustomToChange={agenda.setCustomTo}
          statusOptions={agenda.statusOptions}
          changingStatusId={agenda.changingStatusId}
          onChangeAppointmentStatus={agenda.changeAppointmentStatus}
          refreshingList={agenda.refreshingList}
        />
      ) : null}
    </section>
  );
};

export default AdminAgendaSection;
