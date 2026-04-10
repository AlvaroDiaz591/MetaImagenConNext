import type { AdminModuleSchema } from "../shared/moduleSchema";

export const pacienteModuleConfig: AdminModuleSchema = {
  id: "pacientes",
  titulo: "Pacientes",
  columnasOcultas: ["id", "usuario_id"],
  etiquetas: {
    nombre: "Nombre",
    apellido_paterno: "Apellido paterno",
    apellido_materno: "Apellido materno",
    email: "Correo",
    telefono: "Telefono",
    estado: "Estado",
    codigo_paciente: "Codigo",
    notas_clinicas: "Notas clinicas",
    fecha_nacimiento: "Fecha de nacimiento",
    creado_en: "Creado",
    actualizado_en: "Actualizado",
  },
  acciones: ["crear", "editar", "eliminar", "ver"],
  submodulos: [
    { id: "pacientes_historial", titulo: "Historial" },
    { id: "pacientes_evaluaciones", titulo: "Evaluaciones" },
  ],
};
