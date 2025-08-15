/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode using a class
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--color-background)',
        'foreground': 'var(--color-foreground)',
        'card': 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        'popover': 'var(--color-popover)',
        'popover-foreground': 'var(--color-popover-foreground)',
        'primary': 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-foreground': 'var(--color-primary-foreground)',
        'secondary': 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        'muted': 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        'accent': 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        'destructive': 'var(--color-destructive)',
        'destructive-foreground': 'var(--color-destructive-foreground)',
        'border': 'var(--color-border)',
        'input': 'var(--color-input)', // For input background if different from card
        'ring': 'var(--color-ring)', // For focus rings
      },
      borderRadius: {
        xl: `calc(var(--radius) + 8px)`, // increased for more rounded cards
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'focus': '0 0 0 3px var(--color-ring-focus, var(--color-ring))', 
        'card': '0 1px 3px 0 var(--color-border), 0 1px 2px -1px var(--color-border)',
      },
      spacing: {
        '128': '32rem',
      },
      ringColor: { 
        'DEFAULT': 'var(--color-ring)',
      },
      ringOffsetColor: {
         'DEFAULT': 'var(--color-background)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 12px -2px var(--color-primary-hover)',
          },
          '50%': { 
            boxShadow: '0 0 24px 5px var(--color-primary-hover)',
          },
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s infinite ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', 
    }),
    require('@tailwindcss/typography'),
    function ({ addComponents, theme, addVariant }) {
      addComponents({
        '.form-range': {
          '-webkit-appearance': 'none',
          '-moz-appearance': 'none',
          'appearance': 'none',
          'width': '100%',
          'height': '0.5rem',
          'background': 'var(--color-muted)', 
          'border-radius': theme('borderRadius.full'),
          'outline': 'none',
          'transition': 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
             'background': 'var(--color-accent)',
          },
          '&::-webkit-slider-thumb': {
            '-webkit-appearance': 'none',
            'appearance': 'none',
            'width': '1.25rem', 
            'height': '1.25rem', 
            'background': 'var(--color-primary)', 
            'border-radius': '50%', 
            'cursor': 'pointer',
            'border': `2px solid var(--color-card)`,
            'box-shadow': theme('boxShadow.md'), 
            'transition': 'transform 0.15s ease-in-out, background-color 0.2s ease-in-out, box-shadow 0.15s ease-in-out',
            '&:hover': {
                'transform': 'scale(1.1)',
                'box-shadow': theme('boxShadow.lg'),
            },
            '&:active': {
                'transform': 'scale(1.05)',
                'background': 'var(--color-ring)',
                'box-shadow': theme('boxShadow.md'),
            }
          },
          '&::-moz-range-thumb': {
            'width': '1.25rem',
            'height': '1.25rem',
            'background': 'var(--color-primary)',
            'border-radius': '50%',
            'cursor': 'pointer',
            'border': `2px solid var(--color-card)`,
            'box-shadow': theme('boxShadow.md'),
            'transition': 'transform 0.15s ease-in-out, background-color 0.2s ease-in-out, box-shadow 0.15s ease-in-out',
             '&:hover': {
                'transform': 'scale(1.1)',
                'box-shadow': theme('boxShadow.lg'),
            },
            '&:active': {
                'transform': 'scale(1.05)',
                'background': 'var(--color-ring)',
                 'box-shadow': theme('boxShadow.md'),
            }
          },
          '&.form-range-thumb-focus::-webkit-slider-thumb': {
            'box-shadow': `0 0 0 3px var(--color-background), 0 0 0 5px var(--color-ring)`,
          },
          '&.form-range-thumb-focus::-moz-range-thumb': {
            'box-shadow': `0 0 0 3px var(--color-background), 0 0 0 5px var(--color-ring)`,
          }
        }
      });
      addVariant('form-range-thumb-focus', ({ container, separator }) => {
        container.walkRules(rule => {
          rule.selector = `.form-range:focus${separator}${rule.selector.slice(1)}`;
        });
      });
    }
  ],
};