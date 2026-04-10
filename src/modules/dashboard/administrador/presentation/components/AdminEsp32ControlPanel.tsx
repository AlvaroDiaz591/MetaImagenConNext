import type { Esp32BleController } from "../hooks/useEsp32BlePointerControl";
import {
  ESP32_BLE_CHARACTERISTIC_UUID,
  ESP32_BLE_SERVICE_UUID,
} from "../hooks/useEsp32BlePointerControl";
import styles from "../styles/AdminDashboard.module.css";

type AdminEsp32ControlPanelProps = {
  controller: Esp32BleController;
};

const formatValue = (value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0.00";
  }
  return value.toFixed(2);
};

const statusText: Record<Esp32BleController["status"], string> = {
  desconectado: "Desconectado",
  solicitando: "Seleccionando ESP32",
  conectando: "Conectando",
  conectado: "Conectado",
  error: "Con error",
};

const profileLabels: Record<Esp32BleController["controlProfile"], string> = {
  estable: "Estable (quirurgico)",
  balanceado: "Balanceado",
  rapido: "Rapido",
};

const AdminEsp32ControlPanel = ({ controller }: AdminEsp32ControlPanelProps) => {
  const packet = controller.lastPacket;
  const streamLabel = controller.lastPacketAt
    ? `${controller.packetCount} paquetes recibidos, ultimo timestamp ${new Date(controller.lastPacketAt).toLocaleTimeString("es-BO")}`
    : "Sin telemetria todavia";

  return (
    <section className={styles.esp32Panel}>
      <div className={styles.esp32Hero}>
        <div className={styles.esp32HeroCopy}>
          <span className={styles.esp32Badge}>Modulo ESP32</span>
          <h3>Control BLE por movimiento XYZ, Kalman, dwell click y scroll gestual</h3>
          <p>
            Este modulo opera dentro del dashboard con prioridad a movimiento real de mano (X/Y/Z), aplica filtros para
            reducir temblor y mantiene click tras 3 segundos de permanencia mas gestos de scroll.
          </p>
        </div>

        <div className={styles.esp32ActionBlock}>
          <span className={`${styles.esp32StatusPill} ${controller.status === "conectado" ? styles.esp32StatusOnline : ""}`}>
            {statusText[controller.status]}
          </span>
          <div className={styles.esp32ActionRow}>
            <button
              type="button"
              className={styles.esp32PrimaryButton}
              onClick={controller.connect}
              disabled={!controller.isSupported || controller.status === "conectando" || controller.status === "solicitando"}
            >
              {controller.status === "conectado"
                ? "Reconectar"
                : controller.status === "conectando" || controller.status === "solicitando"
                  ? "Conectando..."
                  : "Conectar ESP32"}
            </button>
            <button
              type="button"
              className={styles.esp32SecondaryButton}
              onClick={controller.disconnect}
              disabled={controller.status !== "conectado" && controller.status !== "error"}
            >
              Desconectar
            </button>
            <button type="button" className={styles.esp32GhostButton} onClick={controller.recenterPointer}>
              Recentrar cursor
            </button>
          </div>
          <p className={styles.esp32MetaText}>
            Dispositivo: {controller.deviceName || "Aun no enlazado"}
          </p>
        </div>
      </div>

      {controller.error ? <p className={styles.esp32ErrorBox}>{controller.error}</p> : null}
      {!controller.isSupported ? (
        <p className={styles.esp32WarningBox}>Web Bluetooth requiere Chrome o Edge de escritorio y HTTPS o localhost.</p>
      ) : null}

      <div className={styles.esp32Grid}>
        <article className={styles.esp32Card}>
          <h4>Sensibilidad</h4>
          <div className={styles.esp32SliderRow}>
            <input
              className={styles.esp32Slider}
              type="range"
              min="0.55"
              max="1.8"
              step="0.05"
              value={controller.sensitivity}
              onChange={(event) => controller.setSensitivity(Number(event.target.value))}
            />
            <span>{controller.sensitivity.toFixed(2)}x</span>
          </div>
          <div className={styles.esp32ProfileRow}>
            <label className={styles.esp32ProfileLabel} htmlFor="esp32-profile-select">Modo de control</label>
            <select
              id="esp32-profile-select"
              className={styles.esp32ProfileSelect}
              value={controller.controlProfile}
              onChange={(event) => controller.setControlProfile(event.target.value as Esp32BleController["controlProfile"])}
            >
              <option value="estable">{profileLabels.estable}</option>
              <option value="balanceado">{profileLabels.balanceado}</option>
              <option value="rapido">{profileLabels.rapido}</option>
            </select>
          </div>
          <p className={styles.esp32MetaText}>Ajusta la respuesta combinada de movimiento XYZ filtrado, giroscopio e inclinacion secundaria.</p>
          <p className={styles.esp32MetaText}>Quietud inteligente: si detecta mano casi quieta, frena y bloquea el puntero para apuntar mejor.</p>
        </article>

        <article className={styles.esp32Card}>
          <h4>Gestos configurados</h4>
          <ul className={styles.esp32List}>
            <li>Movimiento del cursor: aceleracion lineal X/Y/Z filtrada (Kalman) con apoyo de giroscopio.</li>
            <li>Agite rapido hacia arriba: bajar scroll del dashboard.</li>
            <li>Agite rapido hacia abajo: subir scroll del dashboard.</li>
            <li>Permanencia 3 segundos: click automatico con rueda visual.</li>
          </ul>
        </article>

        <article className={styles.esp32Card}>
          <h4>BLE del modulo</h4>
          <p className={styles.esp32MetaText}>Servicio: {ESP32_BLE_SERVICE_UUID}</p>
          <p className={styles.esp32MetaText}>Caracteristica: {ESP32_BLE_CHARACTERISTIC_UUID}</p>
          <p className={styles.esp32MetaText}>El firmware envia un paquete binario compacto para evitar cortes por MTU BLE.</p>
          <p className={styles.esp32MetaText}>Stream: {streamLabel}</p>
        </article>
      </div>

      <div className={styles.esp32TelemetryGrid}>
        <article className={styles.esp32TelemetryCard}>
          <span>Roll</span>
          <strong>{formatValue(packet?.roll)}</strong>
        </article>
        <article className={styles.esp32TelemetryCard}>
          <span>Pitch</span>
          <strong>{formatValue(packet?.pitch)}</strong>
        </article>
        <article className={styles.esp32TelemetryCard}>
          <span>Gyro X</span>
          <strong>{formatValue(packet?.gx)}</strong>
        </article>
        <article className={styles.esp32TelemetryCard}>
          <span>Gyro Y</span>
          <strong>{formatValue(packet?.gy)}</strong>
        </article>
        <article className={styles.esp32TelemetryCard}>
          <span>Gesto</span>
          <strong>{packet?.gesture || "none"}</strong>
        </article>
        <article className={styles.esp32TelemetryCard}>
          <span>Cursor</span>
          <strong>
            {Math.round(controller.pointer.x)}, {Math.round(controller.pointer.y)}
          </strong>
        </article>
      </div>

      <div className={styles.esp32Grid}>
        <article className={styles.esp32Card}>
          <h4>Conexion recomendada del MPU9250</h4>
          <div className={styles.esp32PinsGrid}>
            <div className={styles.esp32PinItem}><strong>3V3</strong><span>VCC del MPU9250</span></div>
            <div className={styles.esp32PinItem}><strong>GND</strong><span>GND del MPU9250</span></div>
            <div className={styles.esp32PinItem}><strong>GPIO 21</strong><span>SDA</span></div>
            <div className={styles.esp32PinItem}><strong>GPIO 22</strong><span>SCL</span></div>
          </div>
          <p className={styles.esp32MetaText}>Los cuatro quedan juntos y del mismo lado en la mayoria de placas ESP32 DevKit/ESP32-32X compatibles.</p>
        </article>

        <article className={styles.esp32Card}>
          <h4>Notas de operacion</h4>
          <ul className={styles.esp32List}>
            <li>No controla el mouse global del sistema; controla esta interfaz web.</li>
            <li>Si el cursor queda muy sensible, baja el deslizador antes de recalibrar.</li>
            <li>El click dwell solo se arma sobre botones, enlaces e items marcados como interactivos.</li>
          </ul>
        </article>
      </div>
    </section>
  );
};

export default AdminEsp32ControlPanel;