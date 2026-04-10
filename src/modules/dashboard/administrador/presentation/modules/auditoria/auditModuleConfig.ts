import type { AdminModuleSchema } from "../shared/moduleSchema";

export const auditModuleConfig: AdminModuleSchema = {
  id: "auditoria",
  titulo: "Auditoria y Seguridad",
  columnasOcultas: ["id"],
  etiquetas: {
    email: "Correo",
    rol: "Rol",
    estado: "Estado",
    created_at: "Fecha",
    evento: "Evento",
  },
  acciones: ["ver"],
};
