"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const ESP32_BLE_SERVICE_UUID = "7a1f2000-1e2d-4f92-9bb2-9a6a1a0cf001";
export const ESP32_BLE_CHARACTERISTIC_UUID = "7a1f2001-1e2d-4f92-9bb2-9a6a1a0cf001";

const DWELL_DURATION_MS = 3000;
const CLICK_COOLDOWN_MS = 1600;
const SCROLL_COOLDOWN_MS = 220;
const POINTER_PADDING = 14;
const POINTER_STEP_LIMIT = 24;

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[data-esp32-clickable='true']",
].join(",");

type Esp32Gesture = "none" | "scroll_up" | "scroll_down";

export type Esp32BlePacket = {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  roll: number;
  pitch: number;
  gesture: Esp32Gesture;
  ts: number;
};

export type Esp32PointerState = {
  x: number;
  y: number;
  visible: boolean;
};

export type Esp32HoverState = {
  label: string;
  progress: number;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
};

export type Esp32ControllerStatus = "desconectado" | "solicitando" | "conectando" | "conectado" | "error";
export type Esp32ControlProfile = "estable" | "balanceado" | "rapido";

type PointerProfileConfig = {
  accelPrimaryGain: number;
  accelCrossGain: number;
  gyroGain: number;
  angleGain: number;
  accelDeadzone: number;
  gyroDeadzone: number;
  damping: number;
  maxVelocity: number;
  velocityCutoff: number;
  stillAccelThreshold: number;
  stillGyroThreshold: number;
  stillFramesToLock: number;
  stillDamping: number;
  stillVelocityCutoff: number;
  precisionIntentLow: number;
  precisionIntentMedium: number;
  precisionScaleLow: number;
  precisionScaleMedium: number;
};

const POINTER_PROFILE_CONFIG: Record<Esp32ControlProfile, PointerProfileConfig> = {
  estable: {
    accelPrimaryGain: 6.6,
    accelCrossGain: 2.1,
    gyroGain: 0.018,
    angleGain: 0.075,
    accelDeadzone: 0.028,
    gyroDeadzone: 2.4,
    damping: 0.88,
    maxVelocity: 16,
    velocityCutoff: 0.09,
    stillAccelThreshold: 0.028,
    stillGyroThreshold: 2.2,
    stillFramesToLock: 4,
    stillDamping: 0.42,
    stillVelocityCutoff: 0.15,
    precisionIntentLow: 0.72,
    precisionIntentMedium: 1.45,
    precisionScaleLow: 0.34,
    precisionScaleMedium: 0.62,
  },
  balanceado: {
    accelPrimaryGain: 8.0,
    accelCrossGain: 2.5,
    gyroGain: 0.026,
    angleGain: 0.11,
    accelDeadzone: 0.02,
    gyroDeadzone: 1.8,
    damping: 0.84,
    maxVelocity: 24,
    velocityCutoff: 0.06,
    stillAccelThreshold: 0.02,
    stillGyroThreshold: 1.8,
    stillFramesToLock: 3,
    stillDamping: 0.48,
    stillVelocityCutoff: 0.11,
    precisionIntentLow: 0.62,
    precisionIntentMedium: 1.3,
    precisionScaleLow: 0.42,
    precisionScaleMedium: 0.72,
  },
  rapido: {
    accelPrimaryGain: 9.6,
    accelCrossGain: 3.0,
    gyroGain: 0.032,
    angleGain: 0.14,
    accelDeadzone: 0.016,
    gyroDeadzone: 1.2,
    damping: 0.8,
    maxVelocity: 30,
    velocityCutoff: 0.04,
    stillAccelThreshold: 0.016,
    stillGyroThreshold: 1.2,
    stillFramesToLock: 2,
    stillDamping: 0.58,
    stillVelocityCutoff: 0.08,
    precisionIntentLow: 0.55,
    precisionIntentMedium: 1.15,
    precisionScaleLow: 0.5,
    precisionScaleMedium: 0.82,
  },
};

export type Esp32BleController = {
  isSupported: boolean;
  status: Esp32ControllerStatus;
  controlProfile: Esp32ControlProfile;
  deviceName: string;
  error: string;
  pointer: Esp32PointerState;
  hover: Esp32HoverState;
  lastPacket: Esp32BlePacket | null;
  packetCount: number;
  lastPacketAt: number | null;
  sensitivity: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  recenterPointer: () => void;
  setSensitivity: (value: number) => void;
  setControlProfile: (value: Esp32ControlProfile) => void;
};

const decoder = new TextDecoder();
const BINARY_PACKET_LENGTH = 17;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const applyDeadzone = (value: number, deadzone: number) => {
  if (Math.abs(value) <= deadzone) {
    return 0;
  }

  if (value > 0) {
    return value - deadzone;
  }

  return value + deadzone;
};

const emptyHoverState = (): Esp32HoverState => ({
  label: "",
  progress: 0,
  rect: null,
});

const parsePacket = (view: DataView): Esp32BlePacket | null => {
  if (view.byteLength >= BINARY_PACKET_LENGTH) {
    const gestureCode = view.getUint8(16);
    return {
      ax: view.getInt16(0, true) / 1000,
      ay: view.getInt16(2, true) / 1000,
      az: view.getInt16(4, true) / 1000,
      gx: view.getInt16(6, true) / 10,
      gy: view.getInt16(8, true) / 10,
      gz: view.getInt16(10, true) / 10,
      roll: view.getInt16(12, true) / 100,
      pitch: view.getInt16(14, true) / 100,
      gesture: gestureCode === 1 ? "scroll_up" : gestureCode === 2 ? "scroll_down" : "none",
      ts: Date.now(),
    };
  }

  try {
    const raw = decoder.decode(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)).trim();
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Esp32BlePacket>;
    if (String((parsed as { ready?: boolean }).ready) === "false") {
      return null;
    }
    return {
      ax: Number(parsed.ax || 0),
      ay: Number(parsed.ay || 0),
      az: Number(parsed.az || 0),
      gx: Number(parsed.gx || 0),
      gy: Number(parsed.gy || 0),
      gz: Number(parsed.gz || 0),
      roll: Number(parsed.roll || 0),
      pitch: Number(parsed.pitch || 0),
      gesture:
        parsed.gesture === "scroll_up" || parsed.gesture === "scroll_down" ? parsed.gesture : "none",
      ts: Number(parsed.ts || Date.now()),
    };
  } catch {
    return null;
  }
};

const getInteractiveTarget = (x: number, y: number): HTMLElement | null => {
  const element = document.elementFromPoint(x, y);
  if (!element) {
    return null;
  }

  if (element instanceof HTMLElement && element.matches(INTERACTIVE_SELECTOR)) {
    return element;
  }

  if (element instanceof HTMLElement) {
    return element.closest(INTERACTIVE_SELECTOR);
  }

  return null;
};

const getTargetLabel = (target: HTMLElement): string => {
  const ariaLabel = target.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  const title = target.getAttribute("title");
  if (title) {
    return title.trim();
  }

  const text = target.textContent?.replace(/\s+/g, " ").trim();
  if (text) {
    return text.slice(0, 52);
  }

  return target.tagName.toLowerCase();
};

const getScrollableTarget = (x: number, y: number): HTMLElement | Window => {
  let node = document.elementFromPoint(x, y);

  while (node) {
    if (node instanceof HTMLElement) {
      const style = window.getComputedStyle(node);
      const canScroll = style.overflowY === "auto" || style.overflowY === "scroll";
      if (canScroll && node.scrollHeight > node.clientHeight + 8) {
        return node;
      }
    }
    node = node?.parentElement || null;
  }

  return window;
};

export const useEsp32BlePointerControl = (): Esp32BleController => {
  const isSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;
  const [status, setStatus] = useState<Esp32ControllerStatus>("desconectado");
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const [lastPacket, setLastPacket] = useState<Esp32BlePacket | null>(null);
  const [packetCount, setPacketCount] = useState(0);
  const [lastPacketAt, setLastPacketAt] = useState<number | null>(null);
  const [pointer, setPointer] = useState<Esp32PointerState>({ x: 0, y: 0, visible: false });
  const [hover, setHover] = useState<Esp32HoverState>(emptyHoverState);
  const [sensitivity, setSensitivityState] = useState(1);
  const [controlProfile, setControlProfileState] = useState<Esp32ControlProfile>("estable");

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const pointerRef = useRef<Esp32PointerState>({ x: 0, y: 0, visible: false });
  const hoverTargetRef = useRef<HTMLElement | null>(null);
  const hoverStartedAtRef = useRef(0);
  const lastScrollAtRef = useRef(0);
  const lastClickAtRef = useRef(0);
  const sensitivityRef = useRef(1);
  const controlProfileRef = useRef<Esp32ControlProfile>("estable");
  const velocityXRef = useRef(0);
  const velocityYRef = useRef(0);
  const stillFramesRef = useRef(0);

  const syncPointerState = useCallback((next: Esp32PointerState) => {
    pointerRef.current = next;
    setPointer(next);
  }, []);

  const recenterPointer = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    syncPointerState({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      visible: status === "conectado",
    });
  }, [status, syncPointerState]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    controlProfileRef.current = controlProfile;
  }, [controlProfile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    recenterPointer();
    const onResize = () => recenterPointer();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recenterPointer]);

  const setDisconnectedState = useCallback((nextError = "") => {
    setStatus(nextError ? "error" : "desconectado");
    setError(nextError);
    setDeviceName("");
    setPacketCount(0);
    setLastPacketAt(null);
    setLastPacket(null);
    setHover(emptyHoverState());
    hoverTargetRef.current = null;
    hoverStartedAtRef.current = 0;
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    stillFramesRef.current = 0;
    syncPointerState({ ...pointerRef.current, visible: false });
  }, [syncPointerState]);

  const handleScrollGesture = useCallback((gesture: Esp32Gesture) => {
    if (gesture === "none" || typeof window === "undefined") {
      return;
    }

    const now = Date.now();
    if (now - lastScrollAtRef.current < SCROLL_COOLDOWN_MS) {
      return;
    }
    lastScrollAtRef.current = now;

    const scrollTarget = getScrollableTarget(pointerRef.current.x, pointerRef.current.y);
    const delta = gesture === "scroll_up" ? 220 : -220;

    if (scrollTarget === window) {
      window.scrollBy({ top: delta, behavior: "auto" });
      return;
    }

    scrollTarget.scrollBy({ top: delta, behavior: "auto" });
  }, []);

  const handlePacket = useCallback((packet: Esp32BlePacket) => {
    if (typeof window === "undefined") {
      return;
    }

    setError("");
    setLastPacket(packet);
    setPacketCount((current) => current + 1);
    setLastPacketAt(Date.now());

    const sensitivityValue = sensitivityRef.current;
    const profile = POINTER_PROFILE_CONFIG[controlProfileRef.current];

    // El firmware envia aceleracion lineal filtrada (Kalman). Esto reduce dependencia de inclinacion.
    const linearAx = applyDeadzone(packet.ax, profile.accelDeadzone);
    const linearAy = applyDeadzone(packet.ay, profile.accelDeadzone);
    const linearAz = applyDeadzone(packet.az, profile.accelDeadzone);
    const gyroX = applyDeadzone(packet.gx, profile.gyroDeadzone);
    const gyroY = applyDeadzone(packet.gy, profile.gyroDeadzone);

    const linearMagnitude = Math.hypot(linearAx, linearAy, linearAz);
    const gyroMagnitude = Math.hypot(gyroX, gyroY);
    const isStillReading =
      linearMagnitude < profile.stillAccelThreshold && gyroMagnitude < profile.stillGyroThreshold;

    if (isStillReading) {
      stillFramesRef.current += 1;
    } else {
      stillFramesRef.current = 0;
    }

    // Z actua como multiplicador de intencion de movimiento: mas gesto frontal, mas respuesta.
    const zBoost = 1 + clamp(Math.abs(linearAz) * 0.4, 0, 0.75);

    const rawMovementX = (
      linearAy * profile.accelPrimaryGain +
      linearAx * profile.accelCrossGain +
      gyroY * profile.gyroGain +
      packet.roll * profile.angleGain
    ) * zBoost;

    const rawMovementY = (
      -linearAx * profile.accelPrimaryGain +
      linearAy * profile.accelCrossGain +
      gyroX * profile.gyroGain +
      packet.pitch * profile.angleGain
    ) * zBoost;

    const intentMagnitude = Math.hypot(rawMovementX, rawMovementY);
    let precisionScale = 1;
    if (intentMagnitude < profile.precisionIntentLow) {
      precisionScale = profile.precisionScaleLow;
    } else if (intentMagnitude < profile.precisionIntentMedium) {
      precisionScale = profile.precisionScaleMedium;
    }

    const movementX = rawMovementX * precisionScale;
    const movementY = rawMovementY * precisionScale;

    if (stillFramesRef.current >= profile.stillFramesToLock) {
      velocityXRef.current *= profile.stillDamping;
      velocityYRef.current *= profile.stillDamping;

      if (Math.abs(velocityXRef.current) < profile.stillVelocityCutoff) {
        velocityXRef.current = 0;
      }
      if (Math.abs(velocityYRef.current) < profile.stillVelocityCutoff) {
        velocityYRef.current = 0;
      }

      const settleX = clamp(
        pointerRef.current.x + clamp(velocityXRef.current, -POINTER_STEP_LIMIT, POINTER_STEP_LIMIT),
        POINTER_PADDING,
        window.innerWidth - POINTER_PADDING,
      );
      const settleY = clamp(
        pointerRef.current.y + clamp(velocityYRef.current, -POINTER_STEP_LIMIT, POINTER_STEP_LIMIT),
        POINTER_PADDING,
        window.innerHeight - POINTER_PADDING,
      );

      syncPointerState({ x: settleX, y: settleY, visible: true });
      return;
    }

    const velocityX = clamp(
      (velocityXRef.current + movementX * sensitivityValue) * profile.damping,
      -profile.maxVelocity,
      profile.maxVelocity,
    );
    const velocityY = clamp(
      (velocityYRef.current + movementY * sensitivityValue) * profile.damping,
      -profile.maxVelocity,
      profile.maxVelocity,
    );

    velocityXRef.current = Math.abs(velocityX) < profile.velocityCutoff ? 0 : velocityX;
    velocityYRef.current = Math.abs(velocityY) < profile.velocityCutoff ? 0 : velocityY;

    const deltaX = clamp(velocityXRef.current, -POINTER_STEP_LIMIT, POINTER_STEP_LIMIT);
    const deltaY = clamp(velocityYRef.current, -POINTER_STEP_LIMIT, POINTER_STEP_LIMIT);

    const nextX = clamp(pointerRef.current.x + deltaX, POINTER_PADDING, window.innerWidth - POINTER_PADDING);
    const nextY = clamp(pointerRef.current.y + deltaY, POINTER_PADDING, window.innerHeight - POINTER_PADDING);

    syncPointerState({ x: nextX, y: nextY, visible: true });
    handleScrollGesture(packet.gesture);
  }, [handleScrollGesture, syncPointerState]);

  const handleCharacteristicNotification = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic | null;
    const value = characteristic?.value;
    if (!value) {
      return;
    }

    const packet = parsePacket(value);
    if (!packet) {
      const raw = decoder.decode(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)).trim();
      if (raw.startsWith("ERR_")) {
        setError(raw);
      }
      return;
    }

    handlePacket(packet);
  }, [handlePacket]);

  const handleGattDisconnected = useCallback(() => {
    const device = deviceRef.current;
    const characteristic = characteristicRef.current;

    if (characteristic) {
      characteristic.removeEventListener("characteristicvaluechanged", handleCharacteristicNotification);
      void characteristic.stopNotifications().catch(() => undefined);
    }

    if (device) {
      device.removeEventListener("gattserverdisconnected", handleGattDisconnected);
    }

    deviceRef.current = null;
    characteristicRef.current = null;
    setDisconnectedState("El ESP32 se desconecto del navegador.");
  }, [handleCharacteristicNotification, setDisconnectedState]);

  const cleanupConnection = useCallback(() => {
    const device = deviceRef.current;
    const characteristic = characteristicRef.current;

    if (characteristic) {
      characteristic.removeEventListener("characteristicvaluechanged", handleCharacteristicNotification);
      void characteristic.stopNotifications().catch(() => undefined);
    }

    if (device) {
      device.removeEventListener("gattserverdisconnected", handleGattDisconnected);
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    }

    deviceRef.current = null;
    characteristicRef.current = null;
  }, [handleCharacteristicNotification, handleGattDisconnected]);

  const connect = useCallback(async () => {
    if (!isSupported || typeof navigator === "undefined") {
      setDisconnectedState("Tu navegador no soporta Web Bluetooth. Usa Chrome o Edge en escritorio.");
      return;
    }

    try {
      setStatus("solicitando");
      setError("");

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [ESP32_BLE_SERVICE_UUID] }],
        optionalServices: [ESP32_BLE_SERVICE_UUID],
      });

      setStatus("conectando");
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("No se pudo abrir el servidor GATT del ESP32.");
      }

      const service = await server.getPrimaryService(ESP32_BLE_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(ESP32_BLE_CHARACTERISTIC_UUID);

      characteristic.addEventListener("characteristicvaluechanged", handleCharacteristicNotification);
      await characteristic.startNotifications();
      device.addEventListener("gattserverdisconnected", handleGattDisconnected);

      deviceRef.current = device;
      characteristicRef.current = characteristic;
      setDeviceName(device.name || "ESP32 BLE");
      setStatus("conectado");
      setHover(emptyHoverState());
      recenterPointer();
    } catch (err) {
      cleanupConnection();
      const message = err instanceof Error ? err.message : "No fue posible conectar el ESP32 por Bluetooth.";
      setDisconnectedState(message);
    }
  }, [cleanupConnection, handleCharacteristicNotification, handleGattDisconnected, isSupported, recenterPointer, setDisconnectedState]);

  const disconnect = useCallback(() => {
    cleanupConnection();
    setDisconnectedState("");
  }, [cleanupConnection, setDisconnectedState]);

  const setSensitivity = useCallback((value: number) => {
    setSensitivityState(clamp(value, 0.55, 1.8));
  }, []);

  const setControlProfile = useCallback((value: Esp32ControlProfile) => {
    if (!(value in POINTER_PROFILE_CONFIG)) {
      return;
    }

    setControlProfileState(value);
    controlProfileRef.current = value;
    stillFramesRef.current = 0;
    velocityXRef.current = 0;
    velocityYRef.current = 0;
  }, []);

  useEffect(() => {
    if (status !== "conectado" || typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      const currentPointer = pointerRef.current;
      if (!currentPointer.visible) {
        return;
      }

      const target = getInteractiveTarget(currentPointer.x, currentPointer.y);
      if (!target) {
        hoverTargetRef.current = null;
        hoverStartedAtRef.current = 0;
        setHover(emptyHoverState());
        return;
      }

      const rect = target.getBoundingClientRect();
      const nextRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };

      if (hoverTargetRef.current !== target) {
        hoverTargetRef.current = target;
        hoverStartedAtRef.current = Date.now();
      }

      const elapsed = Date.now() - hoverStartedAtRef.current;
      const progress = clamp(elapsed / DWELL_DURATION_MS, 0, 1);
      setHover({
        label: getTargetLabel(target),
        progress,
        rect: nextRect,
      });

      if (progress >= 1 && Date.now() - lastClickAtRef.current > CLICK_COOLDOWN_MS) {
        lastClickAtRef.current = Date.now();
        hoverStartedAtRef.current = Date.now();
        target.click();
      }
    }, 90);

    return () => window.clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  return {
    isSupported,
    status,
    controlProfile,
    deviceName,
    error,
    pointer,
    hover,
    lastPacket,
    packetCount,
    lastPacketAt,
    sensitivity,
    connect,
    disconnect,
    recenterPointer,
    setSensitivity,
    setControlProfile,
  };
};