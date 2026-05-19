"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_KINECT_FRAME_SIZE,
  KINECT_TRACKING_ANCHORS,
  getDefaultKinectSocketUrl,
} from "../config/kinectStreamConfig";
import type {
  AdminKinectPostureController,
  KinectConnectionState,
  KinectFrameSize,
  KinectJointMap2D,
  KinectJointMap3D,
  KinectSeverityTone,
  KinectTrackedAnchor,
  KinectVector3,
  KinectWsPayload,
} from "../types/kinectPosture";

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const parseVector3 = (value: unknown): KinectVector3 | null => {
  if (!Array.isArray(value) || value.length < 3) {
    return null;
  }

  const numbers = value.slice(0, 3).map((entry) => Number(entry));
  if (numbers.some((entry) => !Number.isFinite(entry))) {
    return null;
  }

  return [numbers[0], numbers[1], numbers[2]];
};

const parseFrameSize = (value: unknown): KinectFrameSize | null => {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const width = Number(value[0]);
  const height = Number(value[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
};

const parseJoints3d = (value: unknown): KinectJointMap3D => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<KinectJointMap3D>((accumulator, [jointName, jointValue]) => {
    const vector = parseVector3(jointValue);
    if (vector) {
      accumulator[jointName] = vector;
    }
    return accumulator;
  }, {});
};

const parseJoints2d = (value: unknown, frameSize: KinectFrameSize): KinectJointMap2D => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const frameWidth = frameSize.width || DEFAULT_KINECT_FRAME_SIZE.width;
  const frameHeight = frameSize.height || DEFAULT_KINECT_FRAME_SIZE.height;

  return Object.entries(value as Record<string, unknown>).reduce<KinectJointMap2D>((accumulator, [jointName, jointValue]) => {
    if (!Array.isArray(jointValue) || jointValue.length < 2) {
      return accumulator;
    }

    const x = Number(jointValue[0]);
    const y = Number(jointValue[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return accumulator;
    }

    accumulator[jointName] = {
      x: clamp(x / frameWidth, 0, 1),
      y: clamp(y / frameHeight, 0, 1),
    };
    return accumulator;
  }, {});
};

const calculateAngleDeg = (hip: KinectVector3 | null, shoulder: KinectVector3 | null): number | null => {
  if (!hip || !shoulder) {
    return null;
  }

  const verticalDelta = shoulder[1] - hip[1];
  const depthDelta = shoulder[2] - hip[2];
  if (verticalDelta === 0 && depthDelta === 0) {
    return null;
  }

  const radians = Math.atan2(Math.abs(depthDelta), Math.abs(verticalDelta));
  return (radians * 180) / Math.PI;
};

const getPostureDescriptor = (angle: number | null): { label: string; tone: KinectSeverityTone } => {
  if (angle === null) {
    return {
      label: "Esperando referencias de postura",
      tone: "neutral",
    };
  }

  if (angle <= 4) {
    return {
      label: "Columna firme",
      tone: "success",
    };
  }

  if (angle <= 9) {
    return {
      label: "Postura neutral",
      tone: "success",
    };
  }

  if (angle <= 15) {
    return {
      label: "Ligera inclinacion",
      tone: "warning",
    };
  }

  if (angle <= 22) {
    return {
      label: "Tendencia a encorvarse",
      tone: "warning",
    };
  }

  return {
    label: "Encorvado / riesgo alto",
    tone: "danger",
  };
};

const normalizeSocketUrl = (value: string): string => {
  try {
    const normalized = new URL(value.trim());
    if (normalized.protocol !== "ws:" && normalized.protocol !== "wss:") {
      throw new Error();
    }
    return normalized.toString();
  } catch {
    throw new Error("Ingresa una URL WebSocket valida. Ejemplo: ws://localhost:8181");
  }
};

const readSocketMessage = async (value: unknown): Promise<string> => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return value.text();
  }

  if (value instanceof ArrayBuffer) {
    return new TextDecoder().decode(value);
  }

  if (ArrayBuffer.isView(value)) {
    return new TextDecoder().decode(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
  }

  return "";
};

const formatPacketTimestamp = (value: number | null): string => {
  if (!value) {
    return "Sin paquetes recientes";
  }

  return new Date(value).toLocaleString("es-BO");
};

const hasAnchorVector = (anchorId: string, hip: KinectVector3 | null, shoulder: KinectVector3 | null): boolean => {
  if (anchorId === "HipCenter") {
    return Boolean(hip);
  }

  if (anchorId === "ShoulderCenter") {
    return Boolean(shoulder);
  }

  return false;
};

const frameBase64ToObjectUrl = (base64Frame: string): string | null => {
  if (typeof window === "undefined" || !base64Frame.trim()) {
    return null;
  }

  try {
    const binary = window.atob(base64Frame);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
};

export const useAdminKinectPostureStream = (): AdminKinectPostureController => {
  const socketRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const manualDisconnectRef = useRef(false);
  const frameObjectUrlRef = useRef<string | null>(null);
  const lastFramePaintAtRef = useRef(0);

  const [socketUrl, setSocketUrl] = useState(() => getDefaultKinectSocketUrl());
  const [connectionState, setConnectionState] = useState<KinectConnectionState>("idle");
  const [connectionMessage, setConnectionMessage] = useState("Sin conexion");
  const [error, setError] = useState("");
  const [latestFrameSrc, setLatestFrameSrc] = useState<string | null>(null);
  const [joints2d, setJoints2d] = useState<KinectJointMap2D>({});
  const [joints3d, setJoints3d] = useState<KinectJointMap3D>({});
  const [hipVector, setHipVector] = useState<KinectVector3 | null>(null);
  const [shoulderVector, setShoulderVector] = useState<KinectVector3 | null>(null);
  const [angleDeg, setAngleDeg] = useState<number | null>(null);
  const [currentTilt, setCurrentTilt] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [lastPacketAt, setLastPacketAt] = useState<number | null>(null);
  const [frameSize, setFrameSize] = useState<KinectFrameSize>({
    width: DEFAULT_KINECT_FRAME_SIZE.width,
    height: DEFAULT_KINECT_FRAME_SIZE.height,
  });

  const isSupported = typeof window !== "undefined" && typeof WebSocket !== "undefined";
  const requiresSecureBridge = typeof window !== "undefined" && window.location.protocol === "https:" && socketUrl.trim().startsWith("ws://");

  const replaceFrameSource = useCallback((base64Frame: string) => {
    const nextObjectUrl = frameBase64ToObjectUrl(base64Frame);
    if (!nextObjectUrl) {
      return;
    }

    const previousObjectUrl = frameObjectUrlRef.current;
    frameObjectUrlRef.current = nextObjectUrl;
    setLatestFrameSrc(nextObjectUrl);

    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }
  }, []);

  const resetLiveState = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    const previousObjectUrl = frameObjectUrlRef.current;
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
      frameObjectUrlRef.current = null;
    }

    setLatestFrameSrc(null);
    setJoints2d({});
    setJoints3d({});
    setHipVector(null);
    setShoulderVector(null);
    setAngleDeg(null);
    setCurrentTilt(0);
    setPacketCount(0);
    setLastPacketAt(null);
    lastFramePaintAtRef.current = 0;
    setFrameSize({
      width: DEFAULT_KINECT_FRAME_SIZE.width,
      height: DEFAULT_KINECT_FRAME_SIZE.height,
    });
  }, []);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;

    const socket = socketRef.current;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }
    socketRef.current = null;

    if (!mountedRef.current) {
      return;
    }

    setConnectionState("idle");
    setConnectionMessage("Sin conexion");
    setError("");
    resetLiveState();
  }, [resetLiveState]);

  const sendSocketCommand = useCallback((payload: Record<string, number | string>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(payload));
  }, []);

  const sendTiltDelta = useCallback((delta: number) => {
    sendSocketCommand({ command: "tilt", delta });
  }, [sendSocketCommand]);

  const setTiltTarget = useCallback((target: number) => {
    sendSocketCommand({ command: "tilt", target });
    setCurrentTilt(target);
  }, [sendSocketCommand]);

  const connect = useCallback(() => {
    if (!isSupported) {
      setConnectionState("error");
      setConnectionMessage("Tu navegador no soporta WebSocket en este contexto.");
      setError("Abre el modulo desde un navegador moderno de escritorio.");
      return;
    }

    let normalizedUrl = "";
    try {
      normalizedUrl = normalizeSocketUrl(socketUrl);
    } catch (err) {
      setConnectionState("error");
      setConnectionMessage("No se pudo abrir la conexion.");
      setError(err instanceof Error ? err.message : "URL WebSocket invalida.");
      return;
    }

    disconnect();
    manualDisconnectRef.current = false;
    setSocketUrl(normalizedUrl);
    setConnectionState("connecting");
    setConnectionMessage("Conectando con el puente Kinect...");
    setError("");

    try {
      const socket = new WebSocket(normalizedUrl);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      const openWatchdog = window.setTimeout(() => {
        if (!mountedRef.current || socketRef.current !== socket) {
          return;
        }

        if (socket.readyState === WebSocket.OPEN) {
          setConnectionState("connected");
          setConnectionMessage("Conectado, esperando el primer frame del Kinect...");
          setError("");
        }
      }, 1400);

      socket.onopen = () => {
        window.clearTimeout(openWatchdog);
        if (!mountedRef.current) {
          return;
        }

        setConnectionState("connected");
        setConnectionMessage("Conectado, esperando datos del Kinect...");
        setError("");
      };

      socket.onmessage = (event) => {
        void (async () => {
          try {
            const rawMessage = await readSocketMessage(event.data);
            if (!rawMessage.trim()) {
              return;
            }

            if (mountedRef.current) {
              setConnectionState("connected");
              setConnectionMessage("Conexion activa, procesando stream del Kinect...");
            }

            const payload = JSON.parse(rawMessage) as KinectWsPayload;
            const nextFrameSize = parseFrameSize(payload.frameSize) || {
              width: DEFAULT_KINECT_FRAME_SIZE.width,
              height: DEFAULT_KINECT_FRAME_SIZE.height,
            };
            const nextJoints3d = parseJoints3d(payload.joints3d);
            const nextJoints2d = parseJoints2d(payload.joints2d ?? payload.joints, nextFrameSize);
            const nextHip = parseVector3(payload.hip) || nextJoints3d.HipCenter || nextJoints3d.SpineBase || null;
            const nextShoulder =
              parseVector3(payload.shoulder) || nextJoints3d.ShoulderCenter || nextJoints3d.SpineShoulder || null;
            const nextAngle = calculateAngleDeg(nextHip, nextShoulder);
            const nextPacketTimestamp = Date.parse(payload.timestamp || "");

            if (!mountedRef.current) {
              return;
            }

            setFrameSize(nextFrameSize);
            setJoints3d(nextJoints3d);
            setJoints2d(nextJoints2d);
            setHipVector(nextHip);
            setShoulderVector(nextShoulder);
            setAngleDeg(nextAngle);
            setCurrentTilt(typeof payload.cameraTilt === "number" ? Math.round(payload.cameraTilt) : 0);
            setLastPacketAt(Number.isFinite(nextPacketTimestamp) ? nextPacketTimestamp : Date.now());
            setPacketCount((current) => current + 1);
            setConnectionState("connected");
            setError("");
            setConnectionMessage(
              Object.keys(nextJoints2d).length > 0
                ? "Cuerpo detectado y renderizado en tiempo real"
                : typeof payload.frame === "string" && payload.frame.trim()
                  ? "Frame recibido, esperando articulaciones visibles..."
                  : "Conectado, esperando articulaciones visibles...",
            );

            if (typeof payload.frame === "string" && payload.frame.trim()) {
              const now = Date.now();
              if (now - lastFramePaintAtRef.current >= 90) {
                lastFramePaintAtRef.current = now;
                replaceFrameSource(payload.frame);
              }
            }
          } catch (err) {
            if (!mountedRef.current) {
              return;
            }

            setConnectionState("error");
            setConnectionMessage("El paquete recibido no es valido.");
            setError(err instanceof Error ? err.message : "No fue posible interpretar el stream del Kinect.");
          }
        })();
      };

      socket.onerror = () => {
        window.clearTimeout(openWatchdog);
        if (!mountedRef.current) {
          return;
        }

        setConnectionState("error");
        setConnectionMessage("La conexion WebSocket encontro un error.");
        setError("Verifica que el puente C# este ejecutandose y accesible en la URL configurada.");
        resetLiveState();
      };

      socket.onclose = (event) => {
        window.clearTimeout(openWatchdog);
        if (manualDisconnectRef.current) {
          manualDisconnectRef.current = false;
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        setConnectionState("error");
        setConnectionMessage(
          event.reason
            ? `Conexion finalizada: ${event.reason}`
            : `Conexion finalizada por el servidor${event.code ? ` (codigo ${event.code})` : ""}`,
        );
        resetLiveState();
      };
    } catch (err) {
      setConnectionState("error");
      setConnectionMessage("No se pudo inicializar el canal WebSocket.");
      setError(err instanceof Error ? err.message : "No se pudo crear la conexion al Kinect.");
    }
  }, [disconnect, isSupported, replaceFrameSource, resetLiveState, socketUrl]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const previousObjectUrl = frameObjectUrlRef.current;
      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
        frameObjectUrlRef.current = null;
      }

      const socket = socketRef.current;
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const postureDescriptor = useMemo(() => getPostureDescriptor(angleDeg), [angleDeg]);

  const trackedAnchors = useMemo<KinectTrackedAnchor[]>(() => {
    return KINECT_TRACKING_ANCHORS.map((anchor) => ({
      ...anchor,
      active: Boolean(joints2d[anchor.id] || joints3d[anchor.id] || hasAnchorVector(anchor.id, hipVector, shoulderVector)),
    }));
  }, [hipVector, joints2d, joints3d, shoulderVector]);

  const jointCount = useMemo(() => Object.keys(joints2d).length, [joints2d]);

  const visibilityScore = useMemo(() => {
    return clamp(Math.round((jointCount / 20) * 100), 0, 100);
  }, [jointCount]);

  const bodyRecognitionLabel = useMemo(() => {
    if (jointCount === 0) {
      return connectionState === "connected"
        ? "Conectado, esperando que el cuerpo entre en cuadro"
        : "Sin cuerpo detectado";
    }

    if (jointCount < 8) {
      return "Deteccion parcial del cuerpo";
    }

    if (trackedAnchors.every((anchor) => anchor.active)) {
      return "Esqueleto completo y listo para analisis";
    }

    return "Seguimiento estable en curso";
  }, [connectionState, jointCount, trackedAnchors]);

  return {
    isSupported,
    isConnected: connectionState === "connected",
    requiresSecureBridge,
    socketUrl,
    setSocketUrl,
    connectionState,
    connectionMessage,
    error,
    latestFrameSrc,
    joints2d,
    joints3d,
    hipVector,
    shoulderVector,
    angleDeg,
    postureLabel: postureDescriptor.label,
    postureTone: postureDescriptor.tone,
    currentTilt,
    packetCount,
    lastPacketLabel: formatPacketTimestamp(lastPacketAt),
    frameSize,
    frameSizeLabel: `${frameSize.width} x ${frameSize.height}px`,
    jointCount,
    visibilityScore,
    bodyRecognitionLabel,
    trackedAnchors,
    connect,
    disconnect,
    sendTiltDelta,
    setTiltTarget,
  };
};