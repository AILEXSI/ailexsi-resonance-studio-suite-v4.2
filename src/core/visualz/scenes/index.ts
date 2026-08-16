import type { Scene } from "../types";
import { pulseOrbScene } from "./pulse-orb";
import { spectrumBarsScene } from "./spectrum-bars";
import { particleFieldScene } from "./particle-field";
import { resonanceWaveScene } from "./resonance-wave";
import { tunnelSpiralScene } from "./tunnel-spiral";
import { litaBloomScene } from "./lita-bloom";

export const builtinScenes: Scene[] = [
  resonanceWaveScene,
  spectrumBarsScene,
  pulseOrbScene,
  particleFieldScene,
  tunnelSpiralScene,
  litaBloomScene,
];

export {
  resonanceWaveScene,
  spectrumBarsScene,
  pulseOrbScene,
  particleFieldScene,
  tunnelSpiralScene,
  litaBloomScene,
};
