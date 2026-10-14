export const BRAND = {
  name: 'SpeechScope',
  tagline: 'Speech delivery analytics for coaches and speakers.',
  description: 'Objective, timestamped feedback on speech delivery across pitch, energy, and rhythm.',
  year: new Date().getFullYear(),
  links: {
    overview: '/',
    evaluate: '/evaluate',
    history: '/evaluations',
    dataset: '/dataset',
  },
} as const;
