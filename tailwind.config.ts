import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Liberation Sans",
          "sans-serif"
        ],
      },
      colors: {
        /* ========== NEUTRALS ========== */
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))"
        },
        border: "hsl(var(--border))",
        text: {
          DEFAULT: "hsl(var(--text))",
          muted: "hsl(var(--text-muted))"
        },

        /* ========== BRAND COLORS ========== */
        brand: {
          50: "hsl(var(--brand-50))",
          100: "hsl(var(--brand-100))",
          200: "hsl(var(--brand-200))",
          300: "hsl(var(--brand-300))",
          400: "hsl(var(--brand-400))",
          500: "hsl(var(--brand-500))",
          600: "hsl(var(--brand-600))",
          700: "hsl(var(--brand-700))"
        },

        /* ========== SECTION TINTS ========== */
        tint: {
          blue: "hsl(var(--tint-blue-50))",
          sand: "hsl(var(--tint-sand-50))",
          mint: "hsl(var(--tint-mint-50))"
        },

        /* ========== SEMANTIC COLORS ========== */
        success: {
          50: "hsl(var(--success-50))",
          600: "hsl(var(--success-600))"
        },
        info: {
          50: "hsl(var(--info-50))",
          600: "hsl(var(--info-600))"
        },
        warn: {
          50: "hsl(var(--warn-50))",
          600: "hsl(var(--warn-600))"
        },
        danger: {
          50: "hsl(var(--danger-50))",
          600: "hsl(var(--danger-600))"
        },

        /* ========== DUTY/REQUIREMENT COLORS ========== */
        duty: {
          required: {
            bg: "hsl(var(--duty-required-bg))",
            text: "hsl(var(--duty-required-text))",
            border: "hsl(var(--duty-required-border))"
          },
          optional: {
            bg: "hsl(var(--duty-optional-bg))",
            text: "hsl(var(--duty-optional-text))",
            border: "hsl(var(--duty-optional-border))"
          }
        },

        /* ========== SHADCN THEME MAPPING ========== */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        ring: "hsl(var(--ring))",
        input: "hsl(var(--input))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "calc(var(--radius-lg) + 4px)"
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)'
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        'focus': '0 0 0 2px hsl(var(--ring))',
        'focus-visible': '0 0 0 2px hsl(var(--ring))',
      },
      fontSize: {
        'h1': ['var(--text-h1)', { lineHeight: 'var(--text-h1-lh)', letterSpacing: 'var(--letter-spacing-tight)' }],
        'h2': ['var(--text-h2)', { lineHeight: 'var(--text-h2-lh)', letterSpacing: 'var(--letter-spacing-tight)' }],
        'h3': ['var(--text-h3)', { lineHeight: 'var(--text-h3-lh)', letterSpacing: 'var(--letter-spacing-tight)' }],
        'body': ['var(--text-body)', { lineHeight: 'var(--text-body-lh)' }],
        'small': ['var(--text-small)', { lineHeight: 'var(--text-small-lh)' }]
      },
      transitionDuration: {
        'smooth': 'var(--transition-smooth)'
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out"
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          '&:focus-visible': {
            outline: '2px solid hsl(var(--ring))',
            outlineOffset: '2px',
          }
        },
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        }
      })
    }
  ],
} satisfies Config;

export default config;