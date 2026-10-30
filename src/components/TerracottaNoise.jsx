import { memo } from 'react';
import styles from './TerracottaNoise.module.css';

/**
 * TerracottaNoise — fixed, full-viewport, very low-opacity terracotta grain
 * (feTurbulence rasterised once as a tiled data-URI background) plus a warm
 * vignette. Static: no animation, so nothing to reduce.
 */
export const TerracottaNoise = memo(function TerracottaNoise() {
  return <div className={styles.noise} aria-hidden="true" />;
});

export default TerracottaNoise;
