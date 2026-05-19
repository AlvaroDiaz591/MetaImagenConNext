import type { KinectTrackedAnchorDescriptor } from "../types/kinectPosture";

export const KINECT_STREAM_PORT = 8181;

export const DEFAULT_KINECT_FRAME_SIZE = {
  width: 640,
  height: 480,
} as const;

export const KINECT_SKELETON_BONES: ReadonlyArray<readonly [string, string]> = [
  ["Head", "ShoulderCenter"],
  ["ShoulderCenter", "SpineShoulder"],
  ["SpineShoulder", "SpineMid"],
  ["SpineMid", "SpineBase"],
  ["SpineBase", "HipLeft"],
  ["SpineBase", "HipRight"],
  ["ShoulderCenter", "ShoulderLeft"],
  ["ShoulderCenter", "ShoulderRight"],
  ["ShoulderLeft", "ElbowLeft"],
  ["ElbowLeft", "WristLeft"],
  ["WristLeft", "HandLeft"],
  ["ShoulderRight", "ElbowRight"],
  ["ElbowRight", "WristRight"],
  ["WristRight", "HandRight"],
  ["HipLeft", "KneeLeft"],
  ["KneeLeft", "AnkleLeft"],
  ["AnkleLeft", "FootLeft"],
  ["HipRight", "KneeRight"],
  ["KneeRight", "AnkleRight"],
  ["AnkleRight", "FootRight"],
];

export const KINECT_TRACKING_ANCHORS: ReadonlyArray<KinectTrackedAnchorDescriptor> = [
  { id: "Head", label: "Cabeza" },
  { id: "ShoulderCenter", label: "Hombro central" },
  { id: "SpineShoulder", label: "Columna superior" },
  { id: "SpineMid", label: "Columna media" },
  { id: "SpineBase", label: "Base lumbar" },
  { id: "HipCenter", label: "Cadera central" },
];

export const getDefaultKinectSocketUrl = (): string => {
  if (typeof window === "undefined") {
    return `ws://localhost:${KINECT_STREAM_PORT}`;
  }

  const hostname = window.location.hostname || "localhost";
  return `ws://${hostname}:${KINECT_STREAM_PORT}`;
};