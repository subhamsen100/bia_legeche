/* ==========================================================================
   SceneKit: small shared helpers for the scenes (scene-builder owned).
   - useTiming(durationMs, nominalMs): scales choreography delays when the
     config durations are edited (all scene delays are authored for the
     nominal duration and multiplied by k).
   - useAfter(seconds): boolean that flips true after a delay from mount
     (used to mount components whose own entrance runs on mount).
   - Reveal: fade-up wrapper (reduced motion -> opacity only via MotionConfig).
   - GoldRule: hairline divider with a centre bead / kolka.
   - LetterReveal: grapheme-safe letter-by-letter reveal with a gold glint.
   - sceneMemo: memo() that ignores the 10Hz sceneElapsedMs prop so entrance
     animations are never restarted by re-renders.
   ========================================================================== */
import { memo, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import styles from './SceneKit.module.css';

export const EASE = [0.22, 1, 0.36, 1];

/** memo() for timed scenes: re-render only when the duration changes (language comes via context). */
export function sceneMemo(Component) {
  return memo(Component, (a, b) => a.durationMs === b.durationMs);
}

/** Scale factor so choreography authored for `nominalMs` fits the configured duration. */
export function useTiming(durationMs, nominalMs) {
  return useMemo(() => {
    const d = Number(durationMs);
    const k = Number.isFinite(d) && d > 0 ? Math.min(1.6, Math.max(0.45, d / nominalMs)) : 1;
    return (s) => Math.round(s * k * 1000) / 1000;
  }, [durationMs, nominalMs]);
}

/** true once `seconds` have elapsed since mount (immediately when seconds <= 0). */
export function useAfter(seconds) {
  const [on, setOn] = useState(() => !(seconds > 0));
  useEffect(() => {
    if (!Number.isFinite(seconds)) return undefined; // Infinity -> never
    if (!(seconds > 0)) {
      setOn(true);
      return undefined;
    }
    const t = setTimeout(() => setOn(true), seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return on;
}

/** Live matchMedia boolean (SSR-safe default false). */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Fade-up reveal. `as` picks the motion element. */
export function Reveal({ as = 'div', delay = 0, y = 14, duration = 0.9, className, children, style, ...rest }) {
  const M = motion[as] || motion.div;
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </M>
  );
}

/** Gold hairline divider; `draw` animates the lines out from the centre bead. */
export const GoldRule = memo(function GoldRule({ delay = 0, draw = true, className = '', width }) {
  const reduced = useReducedMotionConfig();
  const anim = draw && !reduced;
  const line = (side) => (
    <motion.span
      className={`${styles.ruleLine} ${side === 'r' ? styles.ruleLineR : ''}`}
      initial={anim ? { scaleX: 0 } : draw ? { opacity: 0 } : false}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 1.1, ease: EASE, delay: delay + 0.15 }}
    />
  );
  return (
    <span className={`${styles.rule} ${className}`} style={width ? { width } : undefined} aria-hidden="true">
      {line('l')}
      <motion.span
        className={styles.ruleBead}
        initial={draw ? { opacity: 0, scale: anim ? 0.2 : 1 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay }}
      />
      {line('r')}
    </span>
  );
});

/* ---------- grapheme splitting (Bengali-safe) ---------- */
const VIRAMA = '্';
const JOINERS = /^[‌‍ঁ-ঃ়া-ৌ্ৗৢৣ]/;

/**
 * Split text into user-perceived characters without breaking Bengali clusters:
 * Intl.Segmenter('bn', grapheme), then merge across a virama (conjuncts such as
 * শ্রী, for engines without Unicode 15.1 GB9c) and any leading combining mark.
 */
export function splitGraphemes(text) {
  let parts;
  try {
    const seg = new Intl.Segmenter('bn', { granularity: 'grapheme' });
    parts = Array.from(seg.segment(text), (s) => s.segment);
  } catch {
    parts = Array.from(text);
  }
  const out = [];
  for (const p of parts) {
    const prev = out[out.length - 1];
    if (prev !== undefined && p !== ' ' && (prev.endsWith(VIRAMA) || prev.endsWith('‍') || JOINERS.test(p))) {
      out[out.length - 1] = prev + p;
    } else {
      out.push(p);
    }
  }
  return out;
}

/**
 * Letter-by-letter reveal with a soft gold glint. Words stay unbreakable
 * groups (so lines wrap only at spaces). Screen readers get the plain text.
 * Reduced motion: the whole line fades in.
 * Returns the time (s) when the last letter has landed via `endsAt`.
 */
export function letterTiming(text, { start = 0, step = 0.11 } = {}) {
  const n = splitGraphemes(text).filter((g) => g.trim()).length;
  return { start, step, endsAt: start + Math.max(0, n - 1) * step + 0.7 };
}

export const LetterReveal = memo(function LetterReveal({
  text,
  lang,
  start = 0,
  step = 0.11,
  glintAt, // seconds: when the travelling glint wave sweeps across (optional)
  className = '',
}) {
  const reduced = useReducedMotionConfig();
  const words = useMemo(() => {
    let i = 0;
    return String(text)
      .split(' ')
      .map((w) => splitGraphemes(w).map((g) => ({ g, i: i++ })));
  }, [text]);

  if (reduced) {
    return (
      <motion.span
        className={`${styles.letters} ${className}`}
        lang={lang}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: start }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span className={`${styles.letters} ${className}`} lang={lang}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) => (
          <span key={wi}>
            {wi > 0 && ' '}
            <span className={styles.word}>
              {w.map(({ g, i }) => (
                <motion.span
                  key={i}
                  className={styles.letter}
                  style={{
                    '--in-delay': `${(start + i * step).toFixed(3)}s`,
                    '--glint-delay': glintAt != null ? `${(glintAt + i * 0.055).toFixed(3)}s` : undefined,
                  }}
                  data-glint={glintAt != null ? '' : undefined}
                  initial={{ opacity: 0, y: '0.32em', scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, ease: EASE, delay: start + i * step }}
                >
                  {g}
                </motion.span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
});
