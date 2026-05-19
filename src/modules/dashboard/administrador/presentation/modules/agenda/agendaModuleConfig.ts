import type { AdminModuleSchema } from "../shared/moduleSchema";

export const agendaModuleConfig: AdminModuleSchema = {
  id: "agenda",
  titulo: "Agenda y Citas",
  columnasOcultas: ["id", "paciente_id", "personal_id"],
  etiquetas: {
    scheduled_at: "Fecha programada",
    tipo: "Tipo",
    estado: "Estado",
    es_domicilio: "A domicilio",
    duracion_minutos: "Duracion",
    domicilio_direccion: "Direccion",
    domicilio_referencia: "Referencia",
    creado_en: "Creado",
    actualizado_en: "Actualizado",
  },
  acciones: ["ver", "editar"],
};
