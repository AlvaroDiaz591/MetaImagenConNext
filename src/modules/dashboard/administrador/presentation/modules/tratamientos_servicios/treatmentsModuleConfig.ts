import type { AdminModuleSchema } from "../shared/moduleSchema";

export const treatmentsModuleConfig: AdminModuleSchema = {
  id: "tratamientos_servicios",
  titulo: "Tratamientos y Servicios",
  columnasOcultas: ["id"],
  etiquetas: {
    categoria: "Categoria",
    segmento: "Segmento",
    nombre: "Nombre",
    descripcion: "Descripcion",
    precio_desde: "Precio",
    duracion_minutos: "Duracion",
    activo: "Activo",
    created_at: "Creado",
    updated_at: "Actualizado",
  },
  acciones: ["ver"],
};
