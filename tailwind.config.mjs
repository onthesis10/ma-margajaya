/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        gold: 'var(--color-gold)',
        'gold-soft': 'var(--color-gold-soft)',
        red: 'var(--color-gold)',
        'red-soft': 'var(--color-gold-soft)',
        blue: 'var(--color-blue)',
        'blue-deep': 'var(--color-blue-deep)',
        'blue-ink': 'var(--color-blue-ink)',
        paper: 'var(--color-paper)',
        'paper-warm': 'var(--color-paper-warm)',
        red: 'var(--color-red)',
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        'ink-muted': 'var(--color-ink-muted)',
        hair: 'var(--color-hair)',
        'hair-strong': 'var(--color-hair-strong)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Fraunces"', 'serif'],
      }
    },
  },
  plugins: [],
}
