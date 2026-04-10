"use client";

import React, { useEffect, useRef } from "react";
import styles from "./NeonNodeBackground.module.css";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  phase: number;
};

const NEON_RGB = "53, 255, 182";
const BACKGROUND_STOPS = [
  "rgba(250, 255, 253, 0.94)",
  "rgba(1, 12, 10, 0.98)",
  "rgba(0, 0, 0, 1)",
] as const;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const getDevicePerformanceFactor = () => {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores <= 4 || memory <= 4) {
    return 0.82;
  }

  if (cores <= 6 || memory <= 6) {
    return 0.9;
  }

  return 1;
};

const createNodes = (width: number, height: number, count: number): Node[] => {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.08 + Math.random() * 0.2;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      depth: 0.65 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    };
  });
};

const NeonNodeBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
    };

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let isVisible = true;
    let lastTimestamp = 0;
    let backgroundGradient: CanvasGradient | null = null;
    const performanceFactor = getDevicePerformanceFactor();

    const isMobile = () => window.innerWidth <= 768;

    const getNodeCount = (w: number, h: number) => {
      const byArea = Math.round((w * h) / (isMobile() ? 18500 : 14500));
      const scaled = Math.round(byArea * performanceFactor);
      return clamp(scaled, isMobile() ? 52 : 80, isMobile() ? 96 : 145);
    };

    const getConnectionDistance = () => (isMobile() ? 90 : 110);
    const getInteractionRadius = () => (isMobile() ? 108 : 145);
    const getDistortionRadius = () => (isMobile() ? 146 : 188);

    let nodes = createNodes(window.innerWidth, window.innerHeight, getNodeCount(window.innerWidth, window.innerHeight));

    const displayPoints = new Array<{ x: number; y: number; depth: number }>();

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      nodes = createNodes(width, height, getNodeCount(width, height));

      displayPoints.length = nodes.length;

      backgroundGradient = context.createRadialGradient(
        width * 0.5,
        height * 0.44,
        Math.min(width, height) * 0.1,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.9,
      );

      backgroundGradient.addColorStop(0, BACKGROUND_STOPS[0]);
      backgroundGradient.addColorStop(0.55, BACKGROUND_STOPS[1]);
      backgroundGradient.addColorStop(1, BACKGROUND_STOPS[2]);
    };

    const drawFrame = (timestamp: number, deltaScale: number) => {
      context.clearRect(0, 0, width, height);

      context.fillStyle = backgroundGradient ?? "#000";
      context.fillRect(0, 0, width, height);

      const interactionRadius = getInteractionRadius();
      const distortionRadius = getDistortionRadius();

      mouse.x += (mouse.targetX - mouse.x) * 0.2;
      mouse.y += (mouse.targetY - mouse.y) * 0.2;

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        const wobble = Math.sin(timestamp * 0.00055 + node.phase) * 0.0028;

        node.vx += wobble * node.depth;
        node.vy += Math.cos(timestamp * 0.00045 + node.phase) * 0.0022 * node.depth;

        node.x += node.vx * node.depth * deltaScale;
        node.y += node.vy * node.depth * deltaScale;

        if (node.x <= 0 || node.x >= width) {
          node.vx *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
        }

        if (node.y <= 0 || node.y >= height) {
          node.vy *= -1;
          node.y = Math.max(0, Math.min(height, node.y));
        }

        const nodeSpeed = Math.hypot(node.vx, node.vy);
        const maxSpeed = 0.46;
        const minSpeed = 0.05;

        if (nodeSpeed > maxSpeed) {
          node.vx = (node.vx / nodeSpeed) * maxSpeed;
          node.vy = (node.vy / nodeSpeed) * maxSpeed;
        } else if (nodeSpeed < minSpeed) {
          node.vx += (Math.random() - 0.5) * 0.028;
          node.vy += (Math.random() - 0.5) * 0.028;
        }

        node.vx *= 0.998;
        node.vy *= 0.998;

        let displacedX = node.x;
        let displacedY = node.y;

        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const distance = Math.hypot(dx, dy);

          if (distance < interactionRadius && distance > 0.001) {
            const force = (interactionRadius - distance) / interactionRadius;
            node.vx += (dx / distance) * force * 0.03 * node.depth;
            node.vy += (dy / distance) * force * 0.03 * node.depth;
          }

          if (distance < distortionRadius && distance > 0.001) {
            const distortion = ((distortionRadius - distance) / distortionRadius) ** 1.8;
            displacedX += (dx / distance) * distortion * 19 * node.depth;
            displacedY += (dy / distance) * distortion * 19 * node.depth;
          }
        }

        displayPoints[index] = { x: displacedX, y: displacedY, depth: node.depth };
      }

      const connectionDistance = getConnectionDistance();
      const connectionDistanceSq = connectionDistance * connectionDistance;
      const maxConnectionsPerNode = isMobile() ? 4 : 6;
      const cellSize = connectionDistance;
      const grid = new Map<string, number[]>();

      for (let index = 0; index < displayPoints.length; index += 1) {
        const point = displayPoints[index];
        const cellX = Math.floor(point.x / cellSize);
        const cellY = Math.floor(point.y / cellSize);
        const key = `${cellX},${cellY}`;
        const bucket = grid.get(key);

        if (bucket) {
          bucket.push(index);
        } else {
          grid.set(key, [index]);
        }
      }

      context.globalCompositeOperation = "lighter";
      context.lineWidth = 1.45;

      for (let i = 0; i < displayPoints.length; i += 1) {
        const start = displayPoints[i];
        const baseCellX = Math.floor(start.x / cellSize);
        const baseCellY = Math.floor(start.y / cellSize);
        let connectedCount = 0;

        for (let gx = -1; gx <= 1; gx += 1) {
          for (let gy = -1; gy <= 1; gy += 1) {
            const key = `${baseCellX + gx},${baseCellY + gy}`;
            const neighbors = grid.get(key);

            if (!neighbors) {
              continue;
            }

            for (let k = 0; k < neighbors.length; k += 1) {
              const j = neighbors[k];

              if (j <= i) {
                continue;
              }

              const end = displayPoints[j];
              const dx = start.x - end.x;
              const dy = start.y - end.y;
              const distanceSq = dx * dx + dy * dy;

              if (distanceSq > connectionDistanceSq) {
                continue;
              }

              const distance = Math.sqrt(distanceSq);

              const closeness = 1 - distance / connectionDistance;
              const depthWeight = (start.depth + end.depth) / 2;
              const glowAlpha = Math.min(0.42, closeness * 0.34 * depthWeight);
              const coreAlpha = Math.min(0.94, closeness * 0.6 * depthWeight);

              context.strokeStyle = `rgba(${NEON_RGB}, ${glowAlpha})`;
              context.beginPath();
              context.moveTo(start.x, start.y);
              context.lineTo(end.x, end.y);
              context.stroke();

              context.lineWidth = 0.78;
              context.strokeStyle = `rgba(${NEON_RGB}, ${coreAlpha})`;
              context.beginPath();
              context.moveTo(start.x, start.y);
              context.lineTo(end.x, end.y);
              context.stroke();
              context.lineWidth = 1.45;

              connectedCount += 1;

              if (connectedCount >= maxConnectionsPerNode) {
                break;
              }
            }

            if (connectedCount >= maxConnectionsPerNode) {
              break;
            }
          }

          if (connectedCount >= maxConnectionsPerNode) {
            break;
          }
        }
      }

      for (let index = 0; index < displayPoints.length; index += 1) {
        const point = displayPoints[index];
        const glowRadius = 1.2 + point.depth * 1.75;
        const coreRadius = 0.5 + point.depth * 0.72;
        const glowAlpha = 0.24 + point.depth * 0.2;
        const coreAlpha = 0.78 + point.depth * 0.22;

        context.fillStyle = `rgba(${NEON_RGB}, ${Math.min(glowAlpha, 0.52)})`;
        context.beginPath();
        context.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = `rgba(${NEON_RGB}, ${Math.min(coreAlpha, 0.94)})`;
        context.beginPath();
        context.arc(point.x, point.y, coreRadius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalCompositeOperation = "source-over";
    };

    const animate = (timestamp: number) => {
      if (!isVisible) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }

      const elapsed = timestamp - lastTimestamp;
      const deltaScale = clamp(elapsed / 16.67, 0.7, 1.6);
      lastTimestamp = timestamp;

      drawFrame(timestamp, deltaScale);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: PointerEvent) => {
      mouse.active = true;
      mouse.targetX = event.clientX;
      mouse.targetY = event.clientY;

      if (mouse.x === 0 && mouse.y === 0) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;

      if (isVisible) {
        lastTimestamp = 0;
      }
    };

    resizeCanvas();

    if (mediaQuery.matches) {
      drawFrame(0, 1);
    } else {
      animationFrameId = window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handleMouseMove, { passive: true });
    window.addEventListener("pointerleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("pointerleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={styles.backgroundLayer} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default NeonNodeBackground;
