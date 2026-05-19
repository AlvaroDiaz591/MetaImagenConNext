import styles from "../../styles/PatientLanding.module.css";
import type { PatientAgendaBranch } from "../../../domain/entities/PatientAgenda";

type AgendaClinicFieldsProps = {
  branches: PatientAgendaBranch[];
  selectedBranchId: number | null;
  onChangeBranchId: (id: number | null) => void;
};

const AgendaClinicFields = ({ branches, selectedBranchId, onChangeBranchId }: AgendaClinicFieldsProps) => {
  const selected = branches.find((branch) => branch.id === selectedBranchId) || null;

  return (
    <div className={styles.agendaClinicBlock}>
      <label className={styles.agendaField}>
        <span>Sucursal preferida</span>
        <select
          value={selectedBranchId || ""}
          onChange={(event) => {
            const raw = event.target.value;
            onChangeBranchId(raw ? Number(raw) : null);
          }}
        >
          <option value="">Selecciona una sucursal</option>
          {branches.map((branch) => (
            <option key={`branch-${branch.id || branch.nombre}`} value={branch.id || ""}>
              {branch.nombre}
            </option>
          ))}
        </select>
      </label>

      {selected?.direccion ? <p className={styles.agendaHintText}>{selected.direccion}</p> : null}
    </div>
  );
};

export default AgendaClinicFields;
