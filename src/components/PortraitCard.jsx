/* PortraitCard: ArchFrame + couple photo from config, with the illustrated
   PortraitSilhouette underneath as the fallback. The <img> only shows once it
   has loaded, so a missing file never flashes a broken-image icon; failures are
   remembered per src so later mounts (final page) skip straight to the silhouette. */
import { memo, useState } from 'react';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { ArchFrame } from './ArchFrame.jsx';
import { PortraitSilhouette } from './PortraitSilhouette.jsx';
import styles from './PortraitCard.module.css';

const failed = new Set();
const loaded = new Set();

export const PortraitImage = memo(function PortraitImage({ kind = 'groom' }) {
  const { pick } = useLanguage();
  const person = config.couple[kind];
  const src = person.photo;
  const [state, setState] = useState(() => (!src || failed.has(src) ? 'error' : loaded.has(src) ? 'ok' : 'loading'));

  return (
    <div className={styles.portrait} data-portrait={kind} data-photo-state={state}>
      {state !== 'ok' && <PortraitSilhouette kind={kind} />}
      {state !== 'error' && (
        <img
          className={styles.img}
          src={src}
          alt={pick(person.photoAlt)}
          width="600"
          height="800"
          sizes="(min-width: 768px) 280px, 42vw"
          loading="lazy"
          decoding="async"
          data-visible={state === 'ok' ? 'true' : 'false'}
          onLoad={(e) => {
            if (!e.currentTarget.naturalWidth) return;
            loaded.add(src);
            setState('ok');
          }}
          onError={() => {
            failed.add(src);
            setState('error');
          }}
        />
      )}
    </div>
  );
});

export const PortraitCard = memo(function PortraitCard({ kind = 'groom', bloom = true, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <ArchFrame bloom={bloom}>
        <PortraitImage kind={kind} />
      </ArchFrame>
    </div>
  );
});

export default PortraitCard;
