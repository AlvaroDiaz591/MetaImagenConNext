import type { AdminModuleSchema } from "../shared/moduleSchema";

export const esp32ModuleConfig: AdminModuleSchema = {
  id: "esp32_control",
  titulo: "Control ESP32 BLE",
  columnasOcultas: ["id"],
  etiquetas: {
    indicador: "Indicador",
    valor: "Valor",
    estado: "Estado",
  },
  acciones: ["ver"],
  submodulos: [
    { id: "esp32_ble", titulo: "Bluetooth BLE" },
    { id: "esp32_mpu", titulo: "MPU y gestos" },
  ],
};