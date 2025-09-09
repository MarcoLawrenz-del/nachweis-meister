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
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        brand: {
          primary: 'hsl(var(--brand-primary))',
          'primary-50': 'hsl(var(--brand-primary-50))',
          'primary-100': 'hsl(var(--brand-primary-100))',
          'primary-200': 'hsl(var(--brand-primary-200))',
          'primary-300': 'hsl(var(--brand-primary-300))',
          'primary-400': 'hsl(var(--brand-primary-400))',
          'primary-500': 'hsl(var(--brand-primary-500))',
          'primary-600': 'hsl(var(--brand-primary-600))',
          'primary-700': 'hsl(var(--brand-primary-700))',
          'primary-800': 'hsl(var(--brand-primary-800))',
          'primary-900': 'hsl(var(--brand-primary-900))',
          accent: 'hsl(var(--brand-accent))',
          'accent-50': 'hsl(var(--brand-accent-50))',
          'accent-100': 'hsl(var(--brand-accent-100))',
          'accent-200': 'hsl(var(--brand-accent-200))',
          'accent-300': 'hsl(var(--brand-accent-300))',
          'accent-400': 'hsl(var(--brand-accent-400))',
          'accent-500': 'hsl(var(--brand-accent-500))',
          'accent-600': 'hsl(var(--brand-accent-600))',
          'accent-700': 'hsl(var(--brand-accent-700))',
          'accent-800': 'hsl(var(--brand-accent-800))',
          'accent-900': 'hsl(var(--brand-accent-900))',
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
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
