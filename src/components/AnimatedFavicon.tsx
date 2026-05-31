"use client";

import { useEffect, useRef } from "react";

/**
 * AnimatedFavicon — Client-side component that renders a smooth
 * gradient-shifting + pulsing "SWR" favicon using the Canvas API.
 *
 * Animation: The background gradient rotates through hues while
 * the text gently scales (breathe/pulse). Every frame is drawn on
 * an off-screen canvas, converted to a data-URL, and injected into
 * the <link rel="icon"> tag.
 *
 * Performance: Uses requestAnimationFrame throttled to ~12 FPS
 * (one paint every ~83 ms) so it's lightweight.
 */
export default function AnimatedFavicon() {
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    const CANVAS_SIZE = 64; // higher res canvas, browser downscales
    const FPS = 12;
    const FRAME_INTERVAL = 1000 / FPS;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Find or create the dynamic favicon link
    let faviconLink = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][sizes="32x32"]'
    );
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.type = "image/png";
      faviconLink.setAttribute("sizes", "32x32");
      document.head.appendChild(faviconLink);
    }

    /** Draw a single frame */
    function drawFrame(time: number) {
      if (!ctx) return;
      const s = CANVAS_SIZE;

      // --- Animated gradient background ---
      // Rotate the gradient angle over time (full rotation every ~6s)
      const angle = ((time / 6000) * 2 * Math.PI) % (2 * Math.PI);
      const x0 = s / 2 + (s / 2) * Math.cos(angle);
      const y0 = s / 2 + (s / 2) * Math.sin(angle);
      const x1 = s / 2 - (s / 2) * Math.cos(angle);
      const y1 = s / 2 - (s / 2) * Math.sin(angle);

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);

      // Shift hue over time for a living color effect
      // Base: indigo (#4f46e5) → cyan (#06b6d4), shifting smoothly
      const hueShift = (time / 8000) * 360;
      const h1 = (240 + hueShift) % 360; // indigo base
      const h2 = (185 + hueShift) % 360; // cyan base

      grad.addColorStop(0, `hsl(${h1}, 76%, 58%)`);
      grad.addColorStop(1, `hsl(${h2}, 96%, 43%)`);

      // Rounded rect background
      const radius = s * 0.22;
      ctx.clearRect(0, 0, s, s);
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(s - radius, 0);
      ctx.quadraticCurveTo(s, 0, s, radius);
      ctx.lineTo(s, s - radius);
      ctx.quadraticCurveTo(s, s, s - radius, s);
      ctx.lineTo(radius, s);
      ctx.quadraticCurveTo(0, s, 0, s - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // --- Subtle inner glow ---
      const glowGrad = ctx.createRadialGradient(
        s / 2, s / 2, 0,
        s / 2, s / 2, s * 0.55
      );
      glowGrad.addColorStop(0, "rgba(255,255,255,0.18)");
      glowGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // --- Pulsing "SWR" text ---
      // Gentle scale pulse: 1.0 → 1.06 over ~2s
      const pulse = 1 + 0.06 * Math.sin((time / 2000) * Math.PI * 2);

      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.scale(pulse, pulse);

      // Text shadow for depth
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(s * 0.36)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SWR", 0, 1);

      ctx.restore();

      // --- Sparkle dot (orbiting micro-highlight) ---
      const sparkleAngle = ((time / 3000) * 2 * Math.PI) % (2 * Math.PI);
      const sparkleRadius = s * 0.34;
      const sx = s / 2 + sparkleRadius * Math.cos(sparkleAngle);
      const sy = s / 2 + sparkleRadius * Math.sin(sparkleAngle);
      const sparkleAlpha = 0.4 + 0.4 * Math.sin((time / 500) * Math.PI);

      ctx.beginPath();
      ctx.arc(sx, sy, s * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${sparkleAlpha.toFixed(2)})`;
      ctx.fill();

      // Push frame to favicon
      faviconLink!.href = canvas.toDataURL("image/png");
    }

    function loop(time: number) {
      if (time - lastFrameRef.current >= FRAME_INTERVAL) {
        drawFrame(time);
        lastFrameRef.current = time;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // --- Document Title Animation (Marquee when active, flash/alert when inactive) ---
  useEffect(() => {
    let scrollText = "Study With Ritesh | BCECE College Predictor 2026   •   ";
    let intervalId: number | undefined;
    let flashIntervalId: number | undefined;

    const startActiveAnimation = () => {
      window.clearInterval(flashIntervalId);
      window.clearInterval(intervalId);
      
      intervalId = window.setInterval(() => {
        scrollText = scrollText.substring(1) + scrollText.substring(0, 1);
        document.title = scrollText;
      }, 350);
    };

    const startInactiveAnimation = () => {
      window.clearInterval(intervalId);
      window.clearInterval(flashIntervalId);
      
      const messages = [
        "👋 Come back to predict!",
        "🎯 SWR BCECE Advisor Active",
        "⚡ Check Your Cutoff Chances"
      ];
      let msgIndex = 0;
      
      document.title = messages[0];
      flashIntervalId = window.setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        document.title = messages[msgIndex];
      }, 2500);
    };

    // Initialize animation based on current visibility state
    if (document.visibilityState === "visible") {
      startActiveAnimation();
    } else {
      startInactiveAnimation();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        startInactiveAnimation();
      } else {
        // Reset scrolling text to start clean
        scrollText = "Study With Ritesh | BCECE College Predictor 2026   •   ";
        startActiveAnimation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(flashIntervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // This component renders nothing visible
  return null;
}
