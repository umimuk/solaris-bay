const STATIONS = ['SUNSET SYNTH', 'COASTAL CHILL', 'NIGHT DRIVE'];
const CHORDS = [
  [196, 246.94, 293.66, 369.99, 329.63, 246.94, 220, 293.66],
  [130.81, 164.81, 196, 261.63, 220, 164.81, 146.83, 196],
  [110, 164.81, 220, 329.63, 293.66, 220, 164.81, 246.94],
];

/** Offline synthesized engine and ambient radio with graceful no-audio fallback. */
export function createAudio() {
  let context = null;
  let engineOscillator = null;
  let engineGain = null;
  let stationIndex = 0;
  let tick = 0;
  let noteIndex = 0;

  function start() {
    if (context) {
      if (context.state === 'suspended') context.resume().catch(() => {});
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      context = new AudioContextClass();
      engineGain = context.createGain();
      engineGain.gain.value = 0.025;
      engineGain.connect(context.destination);
      engineOscillator = context.createOscillator();
      engineOscillator.type = 'triangle';
      engineOscillator.frequency.value = 84;
      engineOscillator.connect(engineGain);
      engineOscillator.start();
    } catch {
      context = null;
    }
  }

  function tone(frequency, duration = 0.11) {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  return {
    start,
    engine(speed) {
      if (context && engineOscillator) {
        engineOscillator.frequency.setTargetAtTime(62 + Math.abs(speed) * 2, context.currentTime, 0.08);
      }
    },
    update(dt) {
      if (!context) return;
      tick += dt;
      if (tick < 0.31) return;
      tick = 0;
      const frequency = CHORDS[stationIndex][noteIndex % CHORDS[stationIndex].length];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = stationIndex === 1 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(0.018, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.27);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.28);
      noteIndex += 1;
    },
    tone,
    nextStation() {
      stationIndex = (stationIndex + 1) % STATIONS.length;
      noteIndex = 0;
      return STATIONS[stationIndex];
    },
    get station() { return STATIONS[stationIndex]; },
  };
}
