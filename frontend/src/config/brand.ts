export const BRAND = {
  name: 'SpeechScope',
  tagline: 'Objective, timestamped feedback on speech delivery.',
  description: 'A speech delivery analytics tool comparing participant audio to an ideal reference of the exact same transcript.',
  year: new Date().getFullYear(),
  links: {
    overview: '/',
    evaluate: '/evaluate',
    history: '/evaluations',
    dataset: '/dataset',
    apiDocs: '/docs',
  },
} as const;
