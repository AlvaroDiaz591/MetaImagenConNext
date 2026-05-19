export type KinectVector3 = [number, number, number];

export type KinectJoint2DPoint = {
  x: number;
  y: number;
};

export type KinectJointMap2D = Record<string, KinectJoint2DPoint>;
export type KinectJointMap3D = Record<string, KinectVector3>;

export type KinectConnectionState = "idle" | "connecting" | "connected" | "error";
export type KinectSeverityTone = "neutral" | "success" | "warning" | "danger";

export type KinectTrackedAnchorDescriptor = {
  id: string;
  label: string;
};

export type KinectTrackedAnchor = KinectTrackedAnchorDescriptor & {
  active: boolean;
};

export type KinectFrameSize = {
  width: number;
  height: number;
};

export type KinectWsPayload = {
  timestamp?: string;
  hip?: number[] | null;
  shoulder?: number[] | null;
  cameraTilt?: number;
  frameSize?: number[];
  joints3d?: Record<string, number[]>;
  joints2d?: Record<string, number[]>;
  joints?: Record<string, number[]>;
  frame?: string | null;
};

export type AdminKinectPostureController = {
  isSupported: boolean;
  isConnected: boolean;
  requiresSecureBridge: boolean;
  socketUrl: string;
  setSocketUrl: (value: string) => void;
  connectionState: KinectConnectionState;
  connectionMessage: string;
  error: string;
  latestFrameSrc: string | null;
  joints2d: KinectJointMap2D;
  joints3d: KinectJointMap3D;
  hipVector: KinectVector3 | null;
  shoulderVector: KinectVector3 | null;
  angleDeg: number | null;
  postureLabel: string;
  postureTone: KinectSeverityTone;
  currentTilt: number;
  packetCount: number;
  lastPacketLabel: string;
  frameSize: KinectFrameSize;
  frameSizeLabel: string;
  jointCount: number;
  visibilityScore: number;
  bodyRecognitionLabel: string;
  trackedAnchors: KinectTrackedAnchor[];
  connect: () => void;
  disconnect: () => void;
  sendTiltDelta: (delta: number) => void;
  setTiltTarget: (target: number) => void;
};