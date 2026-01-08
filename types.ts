export enum GongType {
  DEEP = 'Deep',
  BRIGHT = 'Bright',
  ETHEREAL = 'Ethereal',
  MANTRA = 'Mantra (Om)',
  BONSHO = 'Bonshō (Buddhist Bell)',
  DORA = 'Dora (Traditional Gong)',
  TIBETAN = 'Cuenco Tibetano (Singing Bowl)',
}

export interface TimerStep {
  id: string;
  name: string;
  duration: number; // in seconds
  gongType: GongType;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  steps: TimerStep[];
  totalDuration: number;
}

export enum AppView {
  LOADING = 'LOADING',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  ACTIVE_TIMER = 'ACTIVE_TIMER',
}