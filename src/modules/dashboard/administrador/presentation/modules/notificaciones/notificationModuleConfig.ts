import type { AdminModuleSchema } from "../shared/moduleSchema";

export const notificationModuleConfig: AdminModuleSchema = {
  id: "notificaciones",
  titulo: "Notificaciones",
  columnasOcultas: ["id", "cita_id", "paciente_id"],
  etiquetas: {
    titulo: "Titulo",
    mensaje: "Descripcion",
    tipo: "Tipo",
    visto: "Leida",
    created_at: "Creada",
    updated_at: "Actualizada",
  },
  acciones: ["ver"],
  submodulos: [
    { id: "notificaciones_no_leidas", titulo: "No leidas" },
    { id: "notificaciones_historial", titulo: "Historial" },
  ],
};
