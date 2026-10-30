import { memo } from 'react';
import { KolkaMotif } from './KolkaMotif.jsx';
import styles from './LalPaarFrame.module.css';

/**
 * LalPaarFrame — lal-paar (red-bordered saree) card: maroon border with gold
 * zari hairlines, ivory inside, rounded, soft shadow, kolka corner motifs.
 * Wraps content, so it is NOT aria-hidden; only the decoration is.
 */
export const LalPaarFrame = memo(function LalPaarFrame({ children, className = '' }) {
  return (
    <div className={`${styles.frame} ${className}`}>
      <span className={styles.zari} aria-hidden="true" />
      <div className={styles.inner}>
        <span className={styles.hairline} aria-hidden="true" />
        <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true">
          <KolkaMotif size={22} />
        </span>
        <span className={`${styles.corner} ${styles.tr}`} aria-hidden="true">
          <KolkaMotif size={22} />
        </span>
        <span className={`${styles.corner} ${styles.bl}`} aria-hidden="true">
          <KolkaMotif size={22} />
        </span>
        <span className={`${styles.corner} ${styles.br}`} aria-hidden="true">
          <KolkaMotif size={22} />
        </span>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
});

export default LalPaarFrame;
