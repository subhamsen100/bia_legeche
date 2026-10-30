import { AnimatePresence, motion } from 'framer-motion';
import config from '../config.js';
import styles from './TimelineSkipHint.module.css';

/* ==========================================================================
   TimelineSkipHint: briefly shows config.copy.skipHint ("tap to continue")
   during the first `showMs` of the first scene of the first run.
   Pass `children` (e.g. <BilingualText text={config.copy.skipHint} />) to
   follow the active language mode; otherwise both languages are rendered.
   Non-interactive (pointer-events: none), so taps on it still skip.
   ========================================================================== */

export function TimelineSkipHint({ timeline, children, showMs = 4500, delayMs = 1200, className }) {
  const { phase, index, sceneElapsedMs } = timeline;
  const runId = timeline.runId ?? 0;
  const hint = config.copy.skipHint || {};
  const hasText = Boolean(children) || Boolean(hint.bn || hint.en);

  const visible =
    hasText &&
    phase === 'playing' &&
    runId === 0 &&
    index === 0 &&
    sceneElapsedMs >= delayMs &&
    sceneElapsedMs < delayMs + showMs;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="skip-hint"
          className={className ? `${styles.hint} ${className}` : styles.hint}
          data-timeline-skip-hint=""
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {children || (
            <>
              {hint.bn ? <span lang="bn" className={styles.bn}>{hint.bn}</span> : null}
              {hint.en ? <span lang="en" className={styles.en}>{hint.en}</span> : null}
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default TimelineSkipHint;
