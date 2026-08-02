import type { Config } from 'tailwindcss';

// Design direction: "drafting table" — Relay is a planning tool, so the UI
// borrows from blueprint paper and technical drawing rather than the usual
// SaaS dark-mode-plus-neon-accent look. See src/app/globals.css for the
// grid-paper background and corner-bracket card treatment that pair with
// these tokens.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F1720',
        surface: '#16212C',
        'surface-raised': '#1D2B38',
        line: '#24313D',
        ink: '#E7ECEF',
        muted: '#8B99A6',
        amber: '#E8A33D',
        teal: '#4FB8A8',
        urgent: '#E1615B',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '2px', // deliberately near-square — blueprint cards, not soft SaaS cards
      },
    },
  },
  plugins: [],
};

export default config;
