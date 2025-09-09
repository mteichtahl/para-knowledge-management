/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
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
  		typography: {
  			DEFAULT: {
  				css: {
  					maxWidth: 'none',
  					color: 'hsl(var(--foreground))',
  					'[class~="lead"]': {
  						color: 'hsl(var(--muted-foreground))',
  					},
  					a: {
  						color: 'hsl(var(--primary))',
  						'&:hover': {
  							color: 'hsl(var(--primary))',
  						},
  					},
  					strong: {
  						color: 'hsl(var(--foreground))',
  					},
  					'ol[type="A"]': {
  						'--list-counter-style': 'upper-alpha',
  					},
  					'ol[type="a"]': {
  						'--list-counter-style': 'lower-alpha',
  					},
  					'ol[type="A" s]': {
  						'--list-counter-style': 'upper-alpha',
  					},
  					'ol[type="a" s]': {
  						'--list-counter-style': 'lower-alpha',
  					},
  					'ol[type="I"]': {
  						'--list-counter-style': 'upper-roman',
  					},
  					'ol[type="i"]': {
  						'--list-counter-style': 'lower-roman',
  					},
  					'ol[type="I" s]': {
  						'--list-counter-style': 'upper-roman',
  					},
  					'ol[type="i" s]': {
  						'--list-counter-style': 'lower-roman',
  					},
  					'ol[type="1"]': {
  						'--list-counter-style': 'decimal',
  					},
  					h1: {
  						color: 'hsl(var(--foreground))',
  					},
  					h2: {
  						color: 'hsl(var(--foreground))',
  					},
  					h3: {
  						color: 'hsl(var(--foreground))',
  					},
  					h4: {
  						color: 'hsl(var(--foreground))',
  					},
  					'figure figcaption': {
  						color: 'hsl(var(--muted-foreground))',
  					},
  					code: {
  						color: 'hsl(var(--foreground))',
  					},
  					'a code': {
  						color: 'hsl(var(--primary))',
  					},
  					pre: {
  						color: 'hsl(var(--muted-foreground))',
  						backgroundColor: 'hsl(var(--muted))',
  					},
  					blockquote: {
  						color: 'hsl(var(--foreground))',
  						borderLeftColor: 'hsl(var(--border))',
  					},
  					'thead th': {
  						color: 'hsl(var(--foreground))',
  						borderBottomColor: 'hsl(var(--border))',
  					},
  					'tbody td': {
  						borderBottomColor: 'hsl(var(--border))',
  					},
  				},
  			},
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
