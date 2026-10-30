import { memo } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { HEART } from '../assets/svg/paths.js';
import styles from './HeartMarker.module.css';

export const HEART_BLINK_PERIOD_MS = 1400;

/**
 * HeartMarker — heart outline (marigold outer, maroon inner, 2.5px) centred
 * over its positioned parent and larger than it. Draws itself via
 * stroke-dasharray, then blinks (opacity 1<->0.25 + scale 1<->1.12, 1.4s,
 * ease-in-out, infinite). Reduced motion: static outline with a fixed glow.
 * Pure CSS animation (compositor-friendly, no per-frame JS).
 */
export const HeartMarker = memo(function HeartMarker({
  size = 56,
  draw = true,
  blink = true,
  delay = 0,
  drawDuration = 1.2,
  className = '',
}) {
  const reduced = useReducedMotionConfig();
  const animDraw = draw && !reduced;
  const animBlink = blink && !reduced;
  const px = typeof size === 'number' ? `${size}px` : size;
  // 2.5 CSS px stroke regardless of rendered size (viewBox is 64 units wide)
  const sw = (2.5 * 64) / (typeof size === 'number' && size > 0 ? size : 56);
  const state = reduced ? 'static' : animBlink ? 'blinking' : 'drawn';

  return (
    <span
      className={`${styles.root} ${reduced ? styles.reduced : ''} ${className}`}
      style={{
        '--hm-size': px,
        '--hm-delay': `${delay}s`,
        '--hm-draw': `${drawDuration}s`,
        '--hm-blink-delay': `${(animDraw ? delay + drawDuration : delay).toFixed(3)}s`,
        '--hm-period': `${HEART_BLINK_PERIOD_MS}ms`,
      }}
      aria-hidden="true"
      data-heart-marker=""
      data-blink-period-ms={HEART_BLINK_PERIOD_MS}
      data-state={state}
      data-reduced-motion={reduced ? 'true' : 'false'}
    >
      <span className={`${styles.pulse} ${animBlink ? styles.blink : ''}`}>
        <svg className={styles.svg} viewBox="0 0 64 64" focusable="false" key={animDraw ? 'd' : 's'}>
          <path
            className={animDraw ? styles.drawPath : undefined}
            d={HEART}
            pathLength="1"
            fill="none"
            stroke="#F2A900"
            strokeWidth={sw.toFixed(3)}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            className={animDraw ? styles.drawPath : undefined}
            d={HEART}
            pathLength="1"
            transform="translate(32 30.5) scale(.86) translate(-32 -30.5)"
            fill="none"
            stroke="#7A1F2B"
            strokeWidth={(sw / 0.86).toFixed(3)}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
});

export default HeartMarker;
