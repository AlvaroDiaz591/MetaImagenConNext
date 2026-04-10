import type { AdminModuleSchema } from "../shared/moduleSchema";

export const userModuleConfig: AdminModuleSchema = {
  id: "users",
  titulo: "Usuarios",
  columnasOcultas: ["id", "firebase_uid", "phone_verified", "paciente_id", "personal_id", "usuario_id"],
  etiquetas: {
    nombre: "Nombre",
    apellido_paterno: "Apellido paterno",
    apellido_materno: "Apellido materno",
    correo_electronico: "Correo",
    email: "Correo",
    telefono: "Telefono",
    rol: "Rol",
    estado: "Estado",
    created_at: "Creado",
    codigo_paciente: "Codigo paciente",
    rol_personal: "Rol del personal",
    personal_activo: "Personal activo",
  },
  acciones: ["crear", "editar", "eliminar", "ver"],
  submodulos: [
    { id: "users_roles", titulo: "Roles" },
    { id: "users_accesos", titulo: "Accesos" },
  ],
};
