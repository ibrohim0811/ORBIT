"use client";

import { useEffect, useRef } from "react";

interface DigitalTwin3DProps {
  heartRate: number;
  isAnomaly: boolean;
}

export default function DigitalTwin3D({ heartRate, isAnomaly }: DigitalTwin3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      if (!isDragging) {
        rotationY += 0.012;
      }
      pulsePhase += (heartRate / 60) * 0.08;

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

      // Draw wireframe grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = isAnomaly ? "rgba(239, 68, 68, 0.45)" : "rgba(34, 211, 238, 0.45)";

      // Draw horizontal rings
      for (let r = 0; r <= rings; r++) {
        ctx.beginPath();
        for (let s = 0; s < segments; s++) {
          const idx = r * segments + s;
          const nextIdx = r * segments + ((s + 1) % segments);
          ctx.moveTo(projected[idx].x, projected[idx].y);
          ctx.lineTo(projected[nextIdx].x, projected[nextIdx].y);
        }
        ctx.stroke();
      }

      // Draw vertical lines
      for (let s = 0; s < segments; s++) {
        ctx.beginPath();
        for (let r = 0; r < rings; r++) {
          const idx = r * segments + s;
          const nextIdx = (r + 1) * segments + s;
          ctx.moveTo(projected[idx].x, projected[idx].y);
          ctx.lineTo(projected[nextIdx].x, projected[nextIdx].y);
        }
        ctx.stroke();
      }

      // Draw cross-diagonal lattice struts
      ctx.strokeStyle = isAnomaly ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 211, 238, 0.2)";
      ctx.beginPath();
      for (let r = 0; r < rings; r++) {
        for (let s = 0; s < segments; s++) {
          const idx = r * segments + s;
          const diagIdx = (r + 1) * segments + ((s + 1) % segments);
          ctx.moveTo(projected[idx].x, projected[idx].y);
          ctx.lineTo(projected[diagIdx].x, projected[diagIdx].y);
        }
      }
      ctx.stroke();

      // Center Vital Node (Heart node sphere)
      const heartPulse = Math.sin(pulsePhase) * 4;
      const sphereRadius = Math.max(12, 16 + heartPulse);

      const sphereGrad = ctx.createRadialGradient(
        cx - 3,
        cy - 20 - 3,
        2,
        cx,
        cy - 20,
        sphereRadius
      );
      if (isAnomaly) {
        sphereGrad.addColorStop(0, "#fca5a5");
        sphereGrad.addColorStop(0.6, "#ef4444");
        sphereGrad.addColorStop(1, "rgba(220, 38, 38, 0.2)");
      } else {
        sphereGrad.addColorStop(0, "#f472b6");
        sphereGrad.addColorStop(0.6, "#ec4899");
        sphereGrad.addColorStop(1, "rgba(236, 72, 153, 0.2)");
      }

      ctx.beginPath();
      ctx.arc(cx, cy - 20, sphereRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Outer glow around sphere
      ctx.beginPath();
      ctx.arc(cx, cy - 20, sphereRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = isAnomaly ? "rgba(239, 68, 68, 0.3)" : "rgba(236, 72, 153, 0.3)";
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
  }, [heartRate, isAnomaly]);

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
