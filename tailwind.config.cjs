/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			// AI-inspired color palette
  			primary: {
  				'50': '#eef2ff',
  				'100': '#e0e7ff',
  				'200': '#c7d2fe',
  				'300': '#a5b4fc',
  				'400': '#818cf8',
  				'500': '#667eea',
  				'600': '#5b6edc',
  				'700': '#4f5dc9',
  				'800': '#434da6',
  				'900': '#3a4283',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#faf5ff',
  				'100': '#f3e8ff',
  				'200': '#e9d5ff',
  				'300': '#d8b4fe',
  				'400': '#c084fc',
  				'500': '#a855f7',
  				'600': '#9333ea',
  				'700': '#7e22ce',
  				'800': '#6b21a8',
  				'900': '#581c87',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			// Neon accent colors for AI vibes
  			neon: {
  				blue: '#00d9ff',
  				purple: '#a855f7',
  				pink: '#ec4899',
  				cyan: '#22d3ee',
  			},
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
			sans: [
				'Inter var', ...require('tailwindcss/defaultTheme').fontFamily.sans
			]
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'2xl': '1rem',
  			'3xl': '1.5rem',
  		},
  		boxShadow: {
  			'neon-blue': '0 0 20px rgba(0, 217, 255, 0.4)',
  			'neon-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
  			'neon-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
  			'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
  			'glow': '0 0 40px rgba(102, 126, 234, 0.3)',
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-ai': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  			'gradient-neon': 'linear-gradient(135deg, #00d9ff 0%, #667eea 100%)',
  			'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  		},
  		animation: {
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'float': 'float 3s ease-in-out infinite',
  			'glow': 'glow 2s ease-in-out infinite',
  			'typing': 'typing 1.4s ease-in-out infinite',
  			'gradient': 'gradient 8s ease infinite',
  		},
  		keyframes: {
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-8px)' },
  			},
  			glow: {
  				'0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)' },
  				'50%': { boxShadow: '0 0 40px rgba(0, 217, 255, 0.6)' },
  			},
  			typing: {
  				'0%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
  				'50%': { opacity: '1', transform: 'translateY(-4px)' },
  			},
  			gradient: {
  				'0%, 100%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  			},
  		},
  		backdropBlur: {
  			xs: '2px',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}