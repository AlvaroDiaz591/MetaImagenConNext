export type AdminTreatmentCategory = "estetica" | "kinesiologia";

export type AdminTreatmentItem = {
  id: number;
  nombre: string;
  categoria: AdminTreatmentCategory;
  segmento: string | null;
  descripcion: string | null;
  beneficios: string[];
  tags: string[];
  precioDesde: number | null;
  precio: number | null;
  duracionMinutos: number | null;
  destacado: boolean;
  activo: boolean;
  estado: string;
  mostrarEnWeb: boolean;
  mostrarEnApp: boolean;
  disponibleEnClinica: boolean;
  disponibleADomicilio: boolean;
  orden: number;
  imagenUrl: string | null;
  videoUrl: string | null;
  creadoEn: string | null;
  actualizadoEn: string | null;
};

export type AdminTreatmentSummary = {
  total: number;
  activos: number;
  destacados: number;
};

export type AdminTreatmentsBootstrap = {
  mensaje: string;
  servicios: AdminTreatmentItem[];
  categorias: AdminTreatmentCategory[];
  resumen: AdminTreatmentSummary;
};

export type AdminTreatmentPayload = {
  nombre: string;
  categoria: AdminTreatmentCategory;
  segmento: string | null;
  descripcion: string | null;
  beneficios: string[];
  tags: string[];
  precioDesde: number | null;
  duracionMinutos: number | null;
  destacado: boolean;
  mostrarEnWeb: boolean;
  mostrarEnApp: boolean;
  disponibleEnClinica: boolean;
  disponibleADomicilio: boolean;
  orden: number | null;
  activo: boolean;
  imagenBase64?: string | null;
  removeImagen?: boolean;
  videoBase64?: string | null;
  removeVideo?: boolean;
};