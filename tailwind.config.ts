import type { Config } from 'tailwindcss';

/** Los colores salen de las variables CSS de styles/globals.css (sistema ClinVi). */
const v = (name: string) => `rgb(var(--clinvi-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Escala forest (primario). Se mantiene el nombre `brand` para no tocar componentes existentes.
        brand: {
          50: v('forest-50'),
          100: v('forest-100'),
          200: v('forest-200'),
          300: v('forest-300'),
          400: v('forest-400'),
          500: v('forest-500'),
          600: v('forest'),
          700: v('forest-700'),
          800: v('forest-800'),
          900: v('forest-900'),
        },
        white: v('white'),
        forest: { DEFAULT: v('forest'), mid: v('forest-mid') },
        terra: { DEFAULT: v('terra'), strong: v('terra-strong'), deep: v('terra-deep'), light: v('terra-light') },
        mist: { DEFAULT: v('mist'), light: v('mist-light') },
        cream: { DEFAULT: v('cream'), dark: v('cream-dark') },
        canvas: v('cream'),
        ink: v('text'),
        muted: v('text-mid'),
        soft: v('text-soft'),
        line: { DEFAULT: v('border'), light: v('border-light') },
        danger: v('danger'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        clinvi: 'var(--clinvi-radius)',
        'clinvi-lg': 'var(--clinvi-radius-lg)',
        'clinvi-xl': 'var(--clinvi-radius-xl)',
        '2xl': '12px',
        '3xl': 'var(--clinvi-radius-lg)',
      },
      boxShadow: {
        card: 'var(--clinvi-shadow-sm)',
        'clinvi-sm': 'var(--clinvi-shadow-sm)',
        'clinvi-md': 'var(--clinvi-shadow-md)',
        'clinvi-lg': 'var(--clinvi-shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
