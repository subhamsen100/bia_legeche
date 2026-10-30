// Dev-only page: /dev/audio — exercises useAudio + AudioControl.
// Optional query params (dev only):
//   ?src=/audio/other.wav   override config.audio.src
//   ?fadeInMs=3000          override fade-in duration
import { useEffect, useMemo, useState } from 'react';
import config from '../config.js';
import { useAudio } from '../hooks/useAudio.js';
import { AudioControl } from '../components/AudioControl.jsx';
import { LanguageProvider } from '../hooks/useLanguage.jsx';
import { LanguageToggle } from '../components/LanguageToggle.jsx';

const page = {
  minHeight: '100dvh',
  padding: 'calc(var(--space-3xl) + var(--safe-top)) var(--space-gutter) var(--space-2xl)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-en-display)',
  boxSizing: 'border-box',
};
const card = {
  maxWidth: 'var(--card-max)',
  margin: '0 auto',
  padding: 'var(--space-lg)',
  border: 'var(--border-gold-hairline)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface)',
  boxShadow: 'var(--shadow-md)',
};
const gateBtn = {
  display: 'block',
  width: '100%',
  minHeight: 'var(--control-size)',
  padding: 'var(--space-sm) var(--space-lg)',
  border: 'var(--border-gold-hairline)',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--maroon)',
  color: 'var(--ivory)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-md)',
  cursor: 'pointer',
};
const mono = { fontFamily: 'ui-monospace, monospace', fontSize: 'var(--fs-sm)', overflowWrap: 'anywhere' };

function useAudioConfig() {
  return useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const cfg = { ...config.audio };
    if (q.get('src')) cfg.src = q.get('src');
    if (q.get('fadeInMs')) cfg.fadeInMs = Number(q.get('fadeInMs'));
    return cfg;
  }, []);
}

function AudioDevPageInner() {
  const cfg = useAudioConfig();
  const audio = useAudio(cfg);
  const [opened, setOpened] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const status = {
    opened,
    muted: audio.muted,
    ready: audio.ready,
    failed: audio.failed,
    hidden,
    src: cfg.src,
  };

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={{ marginTop: 0, color: 'var(--color-heading)', fontSize: 'var(--fs-xl)' }}>/dev/audio</h1>
        <button
          type="button"
          id="fake-gate"
          style={gateBtn}
          onClick={() => {
            audio.play(); // synchronous inside the tap handler, exactly like SceneGate
            setOpened(true);
          }}
        >
          Fake gate: open (play)
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button type="button" id="fade-out" onClick={() => audio.fadeOut()} style={{ ...gateBtn, width: 'auto', fontSize: 'var(--fs-sm)', background: 'var(--leaf)' }}>
            fadeOut()
          </button>
          <button type="button" id="toggle-mute" onClick={audio.toggleMute} style={{ ...gateBtn, width: 'auto', fontSize: 'var(--fs-sm)', background: 'var(--gold-700)' }}>
            toggleMute()
          </button>
        </div>
        <pre id="audio-status" data-status={JSON.stringify(status)} style={{ ...mono, whiteSpace: 'pre-wrap', marginBottom: 0 }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      </div>
      {/* In the real app the control renders only after the gate opens; here always, for testing. */}
      <div style={{ position: 'fixed', top: 'calc(var(--safe-top) + var(--control-inset))', left: 'calc(var(--safe-left) + var(--control-inset))', zIndex: 'var(--z-controls)' }}>
        <LanguageToggle />
      </div>
      <AudioControl audio={audio} />
    </main>
  );
}

export default function AudioDevPage() {
  return (
    <LanguageProvider>
      <AudioDevPageInner />
    </LanguageProvider>
  );
}
