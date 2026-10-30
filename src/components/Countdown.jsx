/* Countdown to the reception (days / hours / minutes / seconds), digits per language mode. */
import { memo } from 'react';
import config from '../config.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { pad2 } from '../utils/bengaliDigits.js';
import { BilingualText } from './BilingualText.jsx';
import styles from './Countdown.module.css';

const UNITS = ['days', 'hours', 'minutes', 'seconds'];

export const Countdown = memo(function Countdown({ showSeconds = true, className = '', compact = false }) {
  const { lang, num } = useLanguage();
  const t = useCountdown();
  const labels = config.copy.countdown;
  const units = showSeconds ? UNITS : UNITS.slice(0, 3);
  const numLang = lang === 'en' ? 'en' : 'bn';

  if (t.done) {
    return (
      <div className={`${styles.root} ${styles.done} ${className}`} data-countdown="done">
        <BilingualText text={labels.done} variant="display" className={styles.doneText} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} ${compact ? styles.compact : ''} ${className}`}
      role="timer"
      aria-live="off"
      aria-atomic="false"
      data-countdown=""
      data-days={t.days}
    >
      {units.map((u) => (
        <div key={u} className={styles.unit} data-unit={u}>
          <span className={styles.value} lang={numLang} data-num-lang={numLang}>
            {u === 'days' ? num(t.days) : pad2(t[u], lang)}
          </span>
          <BilingualText text={labels[u]} as="span" variant="caption" className={styles.label} />
        </div>
      ))}
    </div>
  );
});

export default Countdown;
