import { agendaModuleConfig } from "./agenda/agendaModuleConfig";
import { attachmentsModuleConfig } from "./adjuntos/attachmentsModuleConfig";
import { auditModuleConfig } from "./auditoria/auditModuleConfig";
import { billingModuleConfig } from "./facturacion_pagos/billingModuleConfig";
import { esp32ModuleConfig } from "./esp32/esp32ModuleConfig";
import { medicalHistoryModuleConfig } from "./historial_medico/medicalHistoryModuleConfig";
import { kinectModuleConfig } from "./kinect_postura/kinectModuleConfig";
import { metricsModuleConfig } from "./metricas/metricsModuleConfig";
import { notificationModuleConfig } from "./notificaciones/notificationModuleConfig";
import { pacienteModuleConfig } from "./pacientes/pacienteModuleConfig";
import { personalModuleConfig } from "./personal/personalModuleConfig";
import { defaultModuleSchema, type AdminModuleSchema } from "./shared/moduleSchema";
import { treatmentsModuleConfig } from "./tratamientos_servicios/treatmentsModuleConfig";
import { locationsModuleConfig } from "./ubicaciones/locationsModuleConfig";
import { userModuleConfig } from "./users/userModuleConfig";
import { homeVisitsModuleConfig } from "./visitas_domicilio/homeVisitsModuleConfig";

const registry: Record<string, AdminModuleSchema> = {
  users: userModuleConfig,
  pacientes: pacienteModuleConfig,
  personal: personalModuleConfig,
  agenda: agendaModuleConfig,
  notificaciones: notificationModuleConfig,
  tratamientos_servicios: treatmentsModuleConfig,
  metricas: metricsModuleConfig,
  facturacion_pagos: billingModuleConfig,
  visitas_domicilio: homeVisitsModuleConfig,
  historial_medico: medicalHistoryModuleConfig,
  kinect_postura: kinectModuleConfig,
  esp32_control: esp32ModuleConfig,
  ubicaciones: locationsModuleConfig,
  auditoria: auditModuleConfig,
  adjuntos: attachmentsModuleConfig,
};

export const getModuleSchema = (sectionId: string): AdminModuleSchema => {
  return registry[sectionId] || { ...defaultModuleSchema, id: sectionId };
};

export const PERSONAS_MODULE_IDS = ["users", "pacientes", "personal"];
