import { useMemo } from 'react';
import config from '../config.js';
import { buildQrSvg, MAP_QR_OPTIONS } from './MapQRMatrix.js';
import styles from './MapQR.module.css';

const CORNERS = ['tl', 'tr', 'bl', 'br'];

// Small gold corner flourish (bracket + curl + bead). Drawn for the top-left corner; CSS mirrors it.
function CornerOrnament({ corner }) {
  return (
    <svg
      className={`${styles.ornament} ${styles[corner]}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 16.5V7.2C2.5 4.6 4.6 2.5 7.2 2.5h9.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 13.5c0-3.9 3.1-7 7-7M16.5 2.5c1.8 0 3 1.1 3 2.6 0 1-.8 1.8-1.8 1.8M2.5 16.5c0 1.8 1.1 3 2.6 3 1 0 1.8-.8 1.8-1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="1.7" fill="currentColor" />
    </svg>
  );
}

/**
 * Themed QR card: maroon modules on ivory (EC level H, 4-module quiet zone), gold hairline card with
 * corner ornaments that sit in the card padding, outside the quiet zone.
 * `caption` is a ReactNode from the consumer; `label` is the accessible name (string) of the QR image.
 */
export function MapQR({ url = config.venue.mapsUrl, caption, label, className }) {
  const svg = useMemo(() => buildQrSvg(url, MAP_QR_OPTIONS), [url]);
  const ariaLabel =
    label ?? [config.copy.scanCaption?.bn, config.copy.scanCaption?.en].filter(Boolean).join(' / ');

  return (
    <figure className={className ? `${styles.card} ${className}` : styles.card} data-map-qr="">
      {CORNERS.map((corner) => (
        <CornerOrnament key={corner} corner={corner} />
      ))}
      <div
        className={styles.plate}
        role="img"
        aria-label={ariaLabel || undefined}
        data-qr-url={url}
        // Static markup generated from the matrix (no user HTML), so this is safe.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption != null && caption !== false && (
        <figcaption className={styles.caption}>{caption}</figcaption>
      )}
    </figure>
  );
}

export default MapQR;
