export type AdminCrudAction = "crear" | "editar" | "eliminar" | "ver";

export type AdminModuleSchema = {
  id: string;
  titulo: string;
  columnasOcultas: string[];
  etiquetas: Record<string, string>;
  acciones: AdminCrudAction[];
  submodulos?: Array<{
    id: string;
    titulo: string;
  }>;
};

const HIDDEN_TECHNICAL_COLUMNS = [
  "id",
  "usuario_id",
  "paciente_id",
  "personal_id",
  "firebase_uid",
  "password_hash",
];

export const defaultModuleSchema: AdminModuleSchema = {
  id: "default",
  titulo: "Modulo",
  columnasOcultas: HIDDEN_TECHNICAL_COLUMNS,
  etiquetas: {},
  acciones: ["ver"],
};

export const isColumnVisible = (column: string, schema: AdminModuleSchema): boolean => {
  const normalized = column.trim().toLowerCase();
  if (!normalized) return false;
  if (schema.columnasOcultas.includes(normalized)) return false;
  if (normalized.endsWith("_id")) return false;
  return true;
};

export const getColumnLabel = (column: string, schema: AdminModuleSchema): string => {
  const custom = schema.etiquetas[column];
  if (custom) return custom;

  return column
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
};
