import { motion, useReducedMotion } from 'framer-motion';
import config from '../config.js';
import styles from './MapsButton.module.css';

function PinIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.5c-3.9 0-7 3-7 6.9 0 5.1 6.1 11.2 6.4 11.5.3.3.9.3 1.2 0 .3-.3 6.4-6.4 6.4-11.5 0-3.9-3.1-6.9-7-6.9Z"
        fill="currentColor"
      />
      <circle cx="12" cy="9.4" r="2.6" className={styles.iconDot} />
    </svg>
  );
}

/**
 * Maroon pill link that opens the venue in Google Maps (new tab). `children` is the label node
 * supplied by the consumer (e.g. <BilingualText text={config.copy.openInMaps} />).
 * `data-no-skip` keeps taps from skipping timeline scenes.
 */
export function MapsButton({ url = config.venue.mapsUrl, children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-no-skip=""
      data-maps-button=""
      className={className ? `${styles.button} ${className}` : styles.button}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      <PinIcon />
      <span className={styles.label}>{children}</span>
    </motion.a>
  );
}

export default MapsButton;
