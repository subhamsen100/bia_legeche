import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import config from './config.js';
import { LanguageProvider } from './hooks/useLanguage.jsx';
import { useTimeline } from './hooks/useTimeline.js';
import { useAudio } from './hooks/useAudio.js';
import { LanguageToggle } from './components/LanguageToggle.jsx';
import { AudioControl } from './components/AudioControl.jsx';
import { TerracottaNoise } from './components/TerracottaNoise.jsx';
import { FloralCorner } from './components/FloralCorner.jsx';
import { SceneGate } from './components/SceneGate.jsx';
import styles from './App.module.css';

// Dev pages: /dev/<name> -> src/dev/<name>.jsx (owned by the respective agent).
const devPages = import.meta.glob('./dev/*.jsx');

function getDevPage(pathname) {
  const path = pathname === '/dev-gallery' ? '/dev/gallery' : pathname;
  const match = path.match(/^\/dev\/([\w-]+)\/?$/);
  if (!match) return null;
  const loader = devPages[`./dev/${match[1]}.jsx`];
  return loader ? lazy(loader) : null;
}

const DevPage = getDevPage(window.location.pathname);

// Post-gate tree is split out of the entry chunk; it is prefetched while the gate is idle.
const loadStage = () => import('./AppStage.jsx');
const AmbientLayers = lazy(() => loadStage().then((m) => ({ default: m.AmbientLayers })));
const PlayingStage = lazy(() => loadStage().then((m) => ({ default: m.PlayingStage })));
const FinalPage = lazy(() => loadStage().then((m) => ({ default: m.FinalPage })));

function usePrefetchStage() {
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(() => loadStage(), { timeout: 2500 });
    return () => cancel(id);
  }, []);
}

function Invitation() {
  const timeline = useTimeline(config.timeline.scenes);
  const audio = useAudio(config.audio);
  const { phase } = timeline;
  usePrefetchStage();

  // Must stay synchronous: audio.play() needs the gate tap's user gesture.
  const handleOpen = () => {
    audio.play();
    timeline.start();
  };

  return (
    <>
      <TerracottaNoise />
      <FloralCorner position="tl" />
      <FloralCorner position="tr" />
      <FloralCorner position="bl" />
      <FloralCorner position="br" />

      <LanguageToggle className={styles.languageToggle} />
      {phase !== 'gate' && <AudioControl audio={audio} />}

      <main className={styles.main}>
        {/* The gate fades out over the incoming opening scene (both place the lotus identically). */}
        <AnimatePresence>
          {phase === 'gate' && (
            <motion.div
              key="gate"
              className={styles.gateLayer}
              exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeOut' } }}
            >
              <SceneGate onOpen={handleOpen} />
            </motion.div>
          )}
        </AnimatePresence>
        <Suspense fallback={null}>
          {phase === 'playing' && <PlayingStage timeline={timeline} />}
          {phase === 'final' && <FinalPage onReplay={timeline.replay} />}
        </Suspense>
      </main>

      {phase !== 'gate' && (
        <Suspense fallback={null}>
          <AmbientLayers />
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  if (DevPage) {
    return (
      <Suspense fallback={null}>
        <DevPage />
      </Suspense>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <Invitation />
      </LanguageProvider>
    </MotionConfig>
  );
}
