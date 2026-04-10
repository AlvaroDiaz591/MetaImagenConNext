import type { AdminModuleSchema } from "../shared/moduleSchema";

export const medicalHistoryModuleConfig: AdminModuleSchema = {
  id: "historial_medico",
  titulo: "Historial Medico",
  columnasOcultas: ["id", "paciente_id", "personal_referencia"],
  etiquetas: {
    motivo_consulta: "Motivo",
    diagnostico: "Diagnostico",
    detalle: "Detalle",
    plan_tratamiento: "Plan de tratamiento",
    fecha_registro: "Fecha",
    actualizado_en: "Actualizado",
  },
  acciones: ["ver"],
  submodulos: [
    { id: "historial_medico_evaluacion_estetica", titulo: "Evaluacion estetica" },
    { id: "historial_medico_pie_plano", titulo: "Pie plano" },
  ],
};
