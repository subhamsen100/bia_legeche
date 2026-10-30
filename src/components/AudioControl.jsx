import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import styles from './AudioControl.module.css';

function SpeakerIcon({ muted }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" fill="currentColor" fillOpacity="0.18" />
      {muted ? (
        <g>
          <path d="M16 9.5l5 5" />
          <path d="M21 9.5l-5 5" />
        </g>
      ) : (
        <g className={styles.waves}>
          <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          <path d="M18.2 6.8a7.4 7.4 0 0 1 0 10.4" />
        </g>
      )}
    </svg>
  );
}

/**
 * AudioControl — fixed round mute/unmute button (top-right, safe-area aware).
 *
 * Props:
 *   audio      return value of useAudio()  ({ muted, failed, toggleMute })
 *   className  extra class for positioning overrides
 *   pick       optional (pair) => string override; defaults to useLanguage().pick
 *   label      optional explicit aria-label string (overrides pick)
 */
export function AudioControl({ audio, className, pick, label }) {
  const language = useLanguage();
  if (!audio) return null;
  const { muted, failed, toggleMute } = audio;
  const resolve = typeof pick === 'function' ? pick : language.pick;
  const ariaLabel = label || resolve(muted ? config.ui.unmute : config.ui.mute);

  const classes = [styles.button, muted ? styles.muted : '', failed ? styles.failed : '', className || '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={toggleMute}
      aria-label={ariaLabel || undefined}
      title={ariaLabel || undefined}
      aria-pressed={muted}
      data-no-skip=""
      data-audio-failed={failed ? '' : undefined}
    >
      <SpeakerIcon muted={muted} />
    </button>
  );
}

export default AudioControl;
