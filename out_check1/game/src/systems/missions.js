import { MISSIONS } from '../config.js';

const CONTRACTS = [
  { type: 'meet', target: [-115, -340], seconds: 2, hint: 'Reach Niko’s beacon on Sunset Coast.' },
  { type: 'drift', score: 1200, hint: 'Build 1,200 drift points along the coast.' },
  { type: 'raid', district: 'HARBOR DOCKS', kills: 3, hint: 'Clear three syndicate guards at Pier 9.' },
  { type: 'sprint', district: 'NEON DOWNTOWN', speed: 28, seconds: 12, hint: 'Hold above 100 km/h through downtown.' },
  { type: 'escape', district: 'CORAL ISLAND', wanted: 3, hint: 'Reach the island with a three-star pursuit, then lose the tail.' },
  { type: 'escort', district: 'CORAL ISLAND', target: [680, 220], seconds: 8, hint: 'Bring Mara to the safehouse and keep her safe.' },
  { type: 'boss', district: 'HARBOR DOCKS', kills: 8, hint: 'Defeat eight guards in the warehouse.' },
  { type: 'heist', wanted: 5, escape: 'SUNSET COAST', hint: 'Trigger a five-star response, then escape back to the coast.' },
];

/** Story contract progression with independent objective rules and rewards. */
export function createMissionCampaign() {
  return {
    index: 0,
    progress: 0,
    completed: [],
    cash: 2500,
    respect: 0,
    sideDrift: 0,
    complete: false,
    map: MISSIONS,
    get current() { return MISSIONS[this.index] ?? null; },
    get contract() { return CONTRACTS[this.index] ?? null; },
    advance() {
      if (!this.complete || this.index >= MISSIONS.length) return false;
      this.completed.push(MISSIONS[this.index][0]);
      this.cash += 1500 + this.index * 300;
      this.respect += 250;
      this.index += 1;
      this.progress = 0;
      this.complete = false;
      return true;
    },
    runMissionStage(dt, drift, district, context = {}) {
      this.sideDrift = drift;
      if (this.complete || !this.current) return false;
      const contract = this.contract;
      const inDistrict = district === contract.district;
      let qualifies = false;

      switch (contract.type) {
        case 'meet':
          qualifies = Boolean(context.position && distance2D(context.position, contract.target) < 17 && Math.abs(context.speed || 0) < 4);
          break;
        case 'drift':
          this.progress = Math.max(this.progress, drift);
          qualifies = this.progress >= contract.score;
          break;
        case 'raid':
        case 'boss':
          this.progress = inDistrict ? Math.max(this.progress, context.kills || 0) : this.progress;
          qualifies = inDistrict && this.progress >= contract.kills;
          break;
        case 'sprint':
          this.progress = inDistrict && Math.abs(context.speed || 0) >= contract.speed ? this.progress + dt : Math.max(0, this.progress - dt * 1.5);
          qualifies = this.progress >= contract.seconds;
          break;
        case 'escape':
          if (district === contract.district && (context.wanted || 0) >= contract.wanted) this.progress = 1;
          qualifies = this.progress > 0 && (context.wanted || 0) === 0;
          break;
        case 'escort':
          qualifies = Boolean(context.position && distance2D(context.position, contract.target) < 22 && (context.health ?? 100) > 30);
          this.progress = qualifies ? this.progress + dt : Math.max(0, this.progress - dt);
          qualifies = this.progress >= contract.seconds;
          break;
        case 'heist':
          if ((context.wanted || 0) >= contract.wanted) this.progress = 1;
          qualifies = this.progress > 0 && district === contract.escape && (context.wanted || 0) === 0;
          break;
        default:
          break;
      }

      if (qualifies) {
        this.complete = true;
        return true;
      }
      return false;
    },
    get objective() {
      if (!this.current) return 'All eight contracts complete. The Bay is yours.';
      return `${this.contract.hint} ${progressLabel(this.contract, this.progress, this.sideDrift)}`;
    },
  };
}

function distance2D(position, target) {
  return Math.hypot(position.x - target[0], position.z - target[1]);
}

function progressLabel(contract, progress, drift) {
  if (contract.type === 'drift') return `(${Math.floor(Math.min(drift, contract.score))} / ${contract.score})`;
  if (contract.type === 'sprint' || contract.type === 'escort') return `(${Math.floor(Math.min(progress, contract.seconds))} / ${contract.seconds}s)`;
  if (contract.type === 'raid' || contract.type === 'boss') return `(${Math.floor(progress)} / ${contract.kills})`;
  return '';
}
