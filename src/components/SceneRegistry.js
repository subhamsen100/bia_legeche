/* Timed scenes by id (config.timeline.scenes[].id). The gate (SceneGate) and the
   free-scroll page (SceneFinal) are rendered by App outside the timeline stage. */
import { SceneOpening } from './SceneOpening.jsx';
import { SceneNames } from './SceneNames.jsx';
import { SceneFamily } from './SceneFamily.jsx';
import { SceneMessage } from './SceneMessage.jsx';
import { SceneDate } from './SceneDate.jsx';
import { SceneVenue } from './SceneVenue.jsx';
import { SceneClosing } from './SceneClosing.jsx';

export { SceneGate } from './SceneGate.jsx';
export { SceneFinal } from './SceneFinal.jsx';

export const sceneComponents = {
  opening: SceneOpening,
  names: SceneNames,
  family: SceneFamily,
  message: SceneMessage,
  date: SceneDate,
  venue: SceneVenue,
  closing: SceneClosing,
};

export default sceneComponents;
