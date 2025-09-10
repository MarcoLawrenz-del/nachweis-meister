import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        'h1': ['var(--font-size-h1)', { lineHeight: 'var(--line-height-h1)', fontWeight: '700' }],
        'h2': ['var(--font-size-h2)', { lineHeight: 'var(--line-height-h2)', fontWeight: '600' }],
        'h3': ['var(--font-size-h3)', { lineHeight: 'var(--line-height-h3)', fontWeight: '600' }],
        'body': ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)', fontWeight: '400' }],
        'caption': ['var(--font-size-caption)', { lineHeight: 'var(--line-height-caption)', fontWeight: '400' }],
        'small': ['var(--font-size-small)', { lineHeight: 'var(--line-height-small)', fontWeight: '400' }],
      },
      spacing: {
        '8pt': '0.5rem', // 8px - base grid unit
        '16pt': '1rem',   // 16px
        '24pt': '1.5rem', // 24px
        '32pt': '2rem',   // 32px
        '40pt': '2.5rem', // 40px
        '48pt': '3rem',   // 48px
        'touch': 'var(--touch-target-min)', // 44px minimum touch target
      },
      colors: {
        brand: {
          primary: {
            DEFAULT: 'hsl(var(--brand-primary))',
            50: 'hsl(var(--brand-primary-50))',
            100: 'hsl(var(--brand-primary-100))',
            200: 'hsl(var(--brand-primary-200))',
            300: 'hsl(var(--brand-primary-300))',
            400: 'hsl(var(--brand-primary-400))',
            500: 'hsl(var(--brand-primary-500))',
            600: 'hsl(var(--brand-primary-600))',
            700: 'hsl(var(--brand-primary-700))',
            800: 'hsl(var(--brand-primary-800))',
            900: 'hsl(var(--brand-primary-900))',
          },
          'on-primary': 'hsl(var(--brand-on-primary))',
          accent: {
            DEFAULT: 'hsl(var(--brand-accent))',
            50: 'hsl(var(--brand-accent-50))',
            100: 'hsl(var(--brand-accent-100))',
            200: 'hsl(var(--brand-accent-200))',
            300: 'hsl(var(--brand-accent-300))',
            400: 'hsl(var(--brand-accent-400))',
            500: 'hsl(var(--brand-accent-500))',
            600: 'hsl(var(--brand-accent-600))',
            700: 'hsl(var(--brand-accent-700))',
            800: 'hsl(var(--brand-accent-800))',
            900: 'hsl(var(--brand-accent-900))',
          },
          'on-accent': 'hsl(var(--brand-on-accent))',
          success: 'hsl(var(--brand-success))',
          warning: 'hsl(var(--brand-warning))',
          danger: 'hsl(var(--brand-danger))',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--brand-primary))",
          foreground: "hsl(var(--brand-on-primary))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--brand-danger))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--brand-accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
        success: {
          DEFAULT: "hsl(var(--brand-success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--brand-warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--brand-danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
        },
        professional: {
          DEFAULT: "hsl(var(--professional))",
          foreground: "hsl(var(--professional-foreground))",
        },
        trust: "hsl(var(--trust))",
        neutral: "hsl(var(--neutral))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
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
        },
        "fade-out": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)"
          },
          "100%": {
            opacity: "0",
            transform: "translateY(10px)"
          }
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" }
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" }
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      boxShadow: {
        'focus': '0 0 0 2px hsl(var(--ring))',
        'focus-visible': '0 0 0 2px hsl(var(--ring))',
      }
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
          minWidth: 'var(--touch-target-min)',
          minHeight: 'var(--touch-target-min)',
        }
      })
    }
  ],
} satisfies Config;