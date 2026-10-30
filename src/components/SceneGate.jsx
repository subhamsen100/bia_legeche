/* Scene 0 (gate): cream screen, closed lotus bud, "খুলুন / Tap to open".
   Everything is visible at first paint (LCP); only a gentle rise/settle plays.
   The whole surface is one button; App calls audio.play() + timeline.start()
   synchronously from onOpen (autoplay policy).
   The event-name kicker lives OUTSIDE the button (WCAG 2.5.3 / axe
   label-content-name-mismatch): the button keeps an empty slot of the same
   size, and the kicker is laid over that slot (pointer-events: none) so a tap
   on it still lands on the full-screen button underneath.
   No aria-label: the button's accessible name comes from its visible content
   (the config gatePrompt, per language mode, with lang attributes), so name
   and visible label always match. */
import { memo, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import config from '../config.js';
import { BilingualText } from './BilingualText.jsx';
import { LotusBud } from './LotusBud.jsx';
import { EASE, GoldRule } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneGate.module.css';

/* Transform-only entrance: the gate is the LCP screen, so its content is fully
   opaque at first paint (never fade it in from opacity 0). */
function Rise({ children, className, delay = 0, y = 10, scale = 1, duration = 0.9, ...rest }) {
  return (
    <motion.span
      className={className}
      initial={{ y, scale }}
      animate={{ y: 0, scale: 1 }}
      transition={{ duration, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.span>
  );
}

/** Position of `slotRef` relative to `rootRef`, kept in sync with layout changes (resize, font swap). */
function useSlotRect(rootRef, slotRef, watchRefs) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    const slot = slotRef.current;
    if (!root || !slot) return undefined;
    const measure = () => {
      const a = slot.getBoundingClientRect();
      const b = root.getBoundingClientRect();
      const next = { top: a.top - b.top, left: a.left - b.left, width: a.width };
      setRect((r) => (r && Math.abs(r.top - next.top) < 0.5 && Math.abs(r.left - next.left) < 0.5 && Math.abs(r.width - next.width) < 0.5 ? r : next));
    };
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      [root, slot, ...watchRefs.map((r) => r.current)].forEach((el) => el && ro.observe(el));
    }
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [rootRef, slotRef, watchRefs]);
  return rect;
}

export const SceneGate = memo(function SceneGate({ onOpen }) {
  const rootRef = useRef(null);
  const slotRef = useRef(null);
  const lotusRef = useRef(null);
  const belowRef = useRef(null);
  const [watch] = useState(() => [lotusRef, belowRef]);
  const rect = useSlotRect(rootRef, slotRef, watch);

  return (
    <div className={styles.gate} data-scene="gate" ref={rootRef}>
      <button
        type="button"
        className={styles.surface}
        onClick={onOpen}
        data-gate-button=""
      >
        <span className={layout.halo} aria-hidden="true" />
        {/* empty slot: the kicker is overlaid here from outside the button */}
        <span className={styles.kickerSlot} ref={slotRef} aria-hidden="true" />
        <Rise className={styles.lotus} delay={0} y={0} scale={0.96} duration={1.2}>
          <span ref={lotusRef} className={styles.lotusInner}>
            <LotusBud open={false} />
          </span>
        </Rise>
        <span className={styles.below} ref={belowRef}>
          <GoldRule draw={false} />
          <Rise className={styles.prompt} delay={0.25}>
            <BilingualText as="span" text={config.copy.gatePrompt} variant="display" className={styles.promptText} />
          </Rise>
          <span className={styles.tapHint} aria-hidden="true">
            <span />
          </span>
        </span>
      </button>
      <div
        className={styles.kickerLayer}
        style={rect ? { top: rect.top } : { visibility: 'hidden' }}
        data-gate-kicker=""
      >
        <Rise className={styles.kickerRise} delay={0.1}>
          <BilingualText as="span" text={config.event.name} variant="display" className={`${layout.kicker} ${styles.kicker}`} />
        </Rise>
      </div>
    </div>
  );
});

export default SceneGate;
