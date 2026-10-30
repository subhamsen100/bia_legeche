// /dev/qr — MapQR + MapsButton playground (qr-maps-agent). Not part of the production entry chunk.
import config from '../config.js';
import MapQR from '../components/MapQR.jsx';
import MapsButton from '../components/MapsButton.jsx';

// Stand-in for <BilingualText> (owned by content-i18n): Bengali primary, English smaller below.
function Pair({ text, fallback }) {
  const bn = text?.bn || fallback.bn;
  const en = text?.en || fallback.en;
  return (
    <>
      <span lang="bn" style={{ display: 'block', lineHeight: 1.75, fontFamily: 'var(--font-bn-sans)' }}>
        {bn}
      </span>
      <span
        lang="en"
        style={{ display: 'block', lineHeight: 1.3, fontSize: '0.85em', fontFamily: 'var(--font-en-display)' }}
      >
        {en}
      </span>
    </>
  );
}

const caption = (
  <Pair text={config.copy.scanCaption} fallback={{ bn: 'স্ক্যান করুন', en: 'Scan for directions' }} />
);
const buttonLabel = <Pair text={config.copy.openInMaps} fallback={{ bn: 'ম্যাপে দেখুন', en: 'Open in Maps' }} />;
const label = [config.copy.scanCaption.bn, config.copy.scanCaption.en].filter(Boolean).join(' / ');

const page = {
  minHeight: '100dvh',
  padding: 'var(--space-xl) var(--space-gutter)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-2xl)',
  background: 'var(--ivory-200)',
};

// How scene-builder is expected to place them: side by side >= 768px, stacked below.
const pair = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-xl)',
  maxWidth: '100%',
};

export default function QrDev() {
  return (
    <main style={page}>
      <section style={pair} data-dev-qr-pair="">
        <MapQR caption={caption} label={label} />
        <MapsButton>{buttonLabel}</MapsButton>
      </section>
    </main>
  );
}
