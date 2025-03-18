import type { Config } from "tailwindcss";

export default {
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
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' }
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'roar-icon': {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '10%': { transform: 'scale(1.2) rotate(-5deg)' },
          '20%': { transform: 'scale(1.4) rotate(5deg)' },
          '30%': { transform: 'scale(1.6) rotate(-3deg)' },
          '40%': { transform: 'scale(1.4) rotate(3deg)' },
          '50%': { transform: 'scale(1.5) rotate(-2deg)' },
          '60%': { transform: 'scale(1.3) rotate(2deg)' },
          '70%': { transform: 'scale(1.2) rotate(-1deg)' },
          '80%': { transform: 'scale(1.1) rotate(1deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        },
        'roar-waves': {
          '0%': { opacity: '0', transform: 'scale(1)' },
          '10%': { opacity: '0.3', transform: 'scale(1.1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
          '90%': { opacity: '0.1', transform: 'scale(1.6)' },
          '100%': { opacity: '0', transform: 'scale(1.8)' }
        },
        'roar-text': {
          '0%': { opacity: '0', transform: 'translate(0, 0) scale(0.5)' },
          '15%': { opacity: '1', transform: 'translate(10px, -15px) scale(0.9)' },
          '30%': { opacity: '1', transform: 'translate(15px, -25px) scale(1.1)' },
          '45%': { opacity: '1', transform: 'translate(20px, -30px) scale(1.2)' },
          '60%': { opacity: '1', transform: 'translate(25px, -35px) scale(1.1)' },
          '75%': { opacity: '0.8', transform: 'translate(30px, -40px) scale(1)' },
          '90%': { opacity: '0.5', transform: 'translate(35px, -45px) scale(0.9)' },
          '100%': { opacity: '0', transform: 'translate(40px, -50px) scale(0.8)' }
        },
        'shake-subtle': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-1px)' },
          '50%': { transform: 'translateX(1px)' },
          '75%': { transform: 'translateX(-1px)' }
        },
        'slide-up-full': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-up-full': 'slide-up-full 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 3s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'roar-icon': 'roar-icon 1.8s cubic-bezier(0.22, 1, 0.36, 1)',
        'roar-waves': 'roar-waves 1.5s ease-out',
        'roar-text': 'roar-text 2s ease-out',
        'shake-subtle': 'shake-subtle 0.5s ease-in-out'
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				display: ['SF Pro Display', 'Inter', 'sans-serif'],
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
