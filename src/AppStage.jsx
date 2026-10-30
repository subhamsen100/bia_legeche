// Everything that only exists after the gate opens. App.jsx lazy-loads this module so the
// first paint (the gate) ships without scenes, qrcode or the ambient layers.
import config from './config.js';
import { useLanguage } from './hooks/useLanguage.jsx';
import { BilingualText } from './components/BilingualText.jsx';
import { TimelineStage } from './components/TimelineStage.jsx';
import { TimelineProgress } from './components/TimelineProgress.jsx';
import { TimelineSkipHint } from './components/TimelineSkipHint.jsx';
import { Petals } from './components/Petals.jsx';
import { Fireflies } from './components/Fireflies.jsx';
import { Butterfly } from './components/Butterfly.jsx';
import { sceneComponents, SceneFinal } from './components/SceneRegistry.js';

function renderScene(scene, { sceneElapsedMs, durationMs }) {
  const Scene = sceneComponents[scene.id];
  return Scene ? <Scene sceneElapsedMs={sceneElapsedMs} durationMs={durationMs} /> : null;
}

export function AmbientLayers() {
  return (
    <>
      <Petals />
      <Fireflies />
      <Butterfly />
    </>
  );
}

export function PlayingStage({ timeline }) {
  const { pick } = useLanguage();
  return (
    <>
      <TimelineStage timeline={timeline} renderScene={renderScene} />
      <TimelineSkipHint timeline={timeline}>
        <BilingualText text={config.copy.skipHint} variant="caption" />
      </TimelineSkipHint>
      <TimelineProgress timeline={timeline} label={pick(config.ui.progress)} />
    </>
  );
}

export function FinalPage({ onReplay }) {
  return <SceneFinal onReplay={onReplay} />;
}
