"use client";

import { useEffect, useRef } from "react";

interface DigitalTwin3DProps {
  heartRate: number;
  isAnomaly: boolean;
}

export default function DigitalTwin3D({ heartRate, isAnomaly }: DigitalTwin3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heartRateRef = useRef(heartRate);
  const isAnomalyRef = useRef(isAnomaly);

  // Keep refs synchronized with props without restarting canvas animation loop
  useEffect(() => {
    heartRateRef.current = heartRate;
    isAnomalyRef.current = isAnomaly;
  }, [heartRate, isAnomaly]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rotationY = 0;
    let rotationX = 0.2;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      rotationY += deltaX * 0.01;
      rotationX += deltaY * 0.01;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Generate wireframe vertices for an inverted truncated cone / astronaut suit torso
    const rings = 8;
    const segments = 14;
    const height = 180;
    const topRadius = 65;
    const bottomRadius = 35;

    const vertices: { x: number; y: number; z: number }[] = [];
    for (let r = 0; r <= rings; r++) {
      const v = r / rings;
      const radius = topRadius * (1 - v) + bottomRadius * v;
      const y = -height / 2 + v * height;
      for (let s = 0; s < segments; s++) {
        const u = (s / segments) * Math.PI * 2;
        vertices.push({
          x: Math.cos(u) * radius,
          y: y,
          z: Math.sin(u) * radius,
        });
      }
    }

    let pulsePhase = 0;

    const render = () => {
      const currentHr = heartRateRef.current || 75;
      const currentAnomaly = isAnomalyRef.current;

      if (!isDragging) {
        rotationY += 0.012;
      }
      pulsePhase += (currentHr / 60) * 0.08;

      const width = canvas.width;
      const heightPx = canvas.height;
      ctx.clearRect(0, 0, width, heightPx);

      const cx = width / 2;
      const cy = heightPx / 2 - 10;
      const fov = 260;

      // Project vertices
      const projected = vertices.map((v) => {
        // Rotate Y
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const x1 = v.x * cosY + v.z * sinY;
        const z1 = -v.x * sinY + v.z * cosY;

        // Rotate X
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const y2 = v.y * cosX - z1 * sinX;
        const z2 = v.y * sinX + z1 * cosX + 280;

        const scale = fov / z2;
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
        };
      });

      // Draw wireframe rings
      ctx.lineWidth = 1;
      for (let r = 0; r <= rings; r++) {
        const startIdx = r * segments;
        ctx.beginPath();
        const baseAlpha = 0.15 + (r / rings) * 0.2;
        ctx.strokeStyle = currentAnomaly
          ? `rgba(244, 63, 94, ${baseAlpha})`
          : `rgba(6, 182, 212, ${baseAlpha})`;

        for (let s = 0; s < segments; s++) {
          const pt = projected[startIdx + s];
          if (s === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw longitudinal ribs
      for (let s = 0; s < segments; s++) {
        ctx.beginPath();
        ctx.strokeStyle = currentAnomaly
          ? "rgba(244, 63, 94, 0.2)"
          : "rgba(6, 182, 212, 0.2)";
        for (let r = 0; r <= rings; r++) {
          const pt = projected[r * segments + s];
          if (r === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }

      // Draw active sensor nodes on vertices
      projected.forEach((pt, idx) => {
        if (idx % 3 === 0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = currentAnomaly ? "#f43f5e" : "#06b6d4";
          ctx.fill();
        }
      });

      // Central Vital Sphere (Heart / Core node with pulsation)
      const pulse = 1 + Math.sin(pulsePhase) * 0.18;
      const sphereRadius = 14 * pulse;

      const sphereGrad = ctx.createRadialGradient(
        cx - 3,
        cy - 23,
        2,
        cx,
        cy - 20,
        sphereRadius
      );
      if (currentAnomaly) {
        sphereGrad.addColorStop(0, "#ff4d6d");
        sphereGrad.addColorStop(0.6, "#ef4444");
        sphereGrad.addColorStop(1, "rgba(239, 68, 68, 0.2)");
      } else {
        sphereGrad.addColorStop(0, "#a855f7");
        sphereGrad.addColorStop(0.5, "#ec4899");
        sphereGrad.addColorStop(1, "rgba(236, 72, 153, 0.2)");
      }

      ctx.beginPath();
      ctx.arc(cx, cy - 20, sphereRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Outer glow around sphere
      ctx.beginPath();
      ctx.arc(cx, cy - 20, sphereRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = currentAnomaly
        ? "rgba(239, 68, 68, 0.3)"
        : "rgba(236, 72, 153, 0.3)";
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []); // Run ONCE on mount; updates via refs without snapping

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none">
      <canvas
        ref={canvasRef}
        width={260}
        height={240}
        className="w-full max-w-[260px] h-[240px] block"
      />
    </div>
  );
}
