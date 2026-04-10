import type { AdminModuleSchema } from "../shared/moduleSchema";

export const personalModuleConfig: AdminModuleSchema = {
  id: "personal",
  titulo: "Personal",
  columnasOcultas: ["id", "usuario_id"],
  etiquetas: {
    nombre: "Nombre",
    apellido_paterno: "Apellido paterno",
    apellido_materno: "Apellido materno",
    email: "Correo",
    telefono: "Telefono",
    rol_nombre: "Rol principal",
    rol_usuario: "Rol secundario",
    estado: "Estado",
    numero_personal: "Numero de personal",
    numero_empleado: "Numero de empleado",
    turno_laboral: "Turno laboral",
    dias_trabajo: "Dias de trabajo",
    experiencia_tipo: "Tipo de experiencia",
    experiencia_valor: "Experiencia",
    activo: "Activo",
    creado_en: "Creado",
    actualizado_en: "Actualizado",
  },
  acciones: ["crear", "editar", "eliminar", "ver"],
  submodulos: [
    { id: "personal_documentos", titulo: "Documentos" },
    { id: "personal_agenda", titulo: "Agenda" },
  ],
};
