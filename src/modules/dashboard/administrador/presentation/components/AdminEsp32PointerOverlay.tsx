import type { Esp32BleController } from "../hooks/useEsp32BlePointerControl";
import styles from "../styles/AdminDashboard.module.css";

type AdminEsp32PointerOverlayProps = {
  controller: Esp32BleController;
};

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AdminEsp32PointerOverlay = ({ controller }: AdminEsp32PointerOverlayProps) => {
  if (controller.status !== "conectado" || !controller.pointer.visible) {
    return null;
  }

  const dashOffset = CIRCUMFERENCE * (1 - controller.hover.progress);

  return (
    <>
      {controller.hover.rect ? (
        <div
          className={styles.esp32TargetOutline}
          style={{
            left: controller.hover.rect.left,
            top: controller.hover.rect.top,
            width: controller.hover.rect.width,
            height: controller.hover.rect.height,
          }}
        >
          <span className={styles.esp32TargetLabel}>{controller.hover.label}</span>
        </div>
      ) : null}

      <div
        className={styles.esp32PointerOverlay}
        style={{
          left: controller.pointer.x,
          top: controller.pointer.y,
        }}
      >
        <svg className={styles.esp32PointerRing} viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r={RADIUS} className={styles.esp32PointerRingTrack} />
          <circle
            cx="24"
            cy="24"
            r={RADIUS}
            className={styles.esp32PointerRingProgress}
            style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset }}
          />
        </svg>
        <span className={styles.esp32PointerDot} />
      </div>
    </>
  );
};

export default AdminEsp32PointerOverlay;