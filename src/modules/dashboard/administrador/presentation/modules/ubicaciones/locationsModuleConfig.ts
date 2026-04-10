import type { AdminModuleSchema } from "../shared/moduleSchema";

export const locationsModuleConfig: AdminModuleSchema = {
  id: "ubicaciones",
  titulo: "Ubicaciones y Sucursales",
  columnasOcultas: ["id"],
  etiquetas: {
    nombre: "Nombre",
    descripcion: "Descripcion",
    direccion: "Direccion",
    telefono: "Telefono",
    whatsapp: "WhatsApp",
    correo: "Correo",
    horario: "Horario",
    activo: "Activo",
    actualizado_en: "Actualizado",
  },
  acciones: ["ver"],
};
