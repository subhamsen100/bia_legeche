import { useEffect } from 'react';
import { useMotionValue, useSpring, useReducedMotionConfig } from 'framer-motion';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

/**
 * useParallax(strength) -> { x, y } framer-motion MotionValues (px).
 * Driven by page scroll (y drifts up to ~1.5x strength) and device tilt
 * (deviceorientation; never requests the iOS permission prompt).
 * Zero (static) under reduced motion.
 */
export function useParallax(strength = 12) {
  const reduced = useReducedMotionConfig();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  useEffect(() => {
    if (reduced || typeof window === 'undefined' || !strength) {
      rawX.set(0);
      rawY.set(0);
      return undefined;
    }
    let tiltX = 0;
    let tiltY = 0;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const scrollPart = -strength * 1.5 * clamp((window.scrollY || 0) / vh, 0, 1);
      rawX.set(tiltX * strength);
      rawY.set(tiltY * strength + scrollPart);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null) return;
      tiltX = clamp(e.gamma / 30, -1, 1);
      tiltY = clamp((e.beta - 45) / 30, -1, 1);
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    if ('DeviceOrientationEvent' in window) window.addEventListener('deviceorientation', onOrient, { passive: true });
    apply();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('deviceorientation', onOrient);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, strength, rawX, rawY]);

  return { x, y };
}

export default useParallax;
