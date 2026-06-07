/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                "input-border": "hsl(var(--input-border) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
                sidebar: {
                    bg: "hsl(var(--sidebar-bg) / <alpha-value>)",
                    foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
                    muted: "hsl(var(--sidebar-muted) / <alpha-value>)",
                    accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
                    border: "hsl(var(--sidebar-border) / <alpha-value>)",
                },
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
            },
            keyframes: {
                backdropFadeIn: {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' }
                },
                modalSlideUp: {
                    'from': { transform: 'translateY(24px) scale(0.97)', opacity: '0' },
                    'to': { transform: 'translateY(0) scale(1)', opacity: '1' }
                },
                drawerSlideInRight: {
                    'from': { transform: 'translateX(100%)' },
                    'to': { transform: 'translateX(0)' }
                },
                drawerSlideInLeft: {
                    'from': { transform: 'translateX(-100%)' },
                    'to': { transform: 'translateX(0)' }
                },
                kenBurns: {
                    '0%': { transform: 'scale(1) translate(0, 0)' },
                    '50%': { transform: 'scale(1.05) translate(-1%, 1%)' },
                    '100%': { transform: 'scale(1.1) translate(1%, -1%)' }
                }
            },
            animation: {
                backdropFadeIn: 'backdropFadeIn 0.25s ease-out',
                modalSlideUp: 'modalSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                drawerSlideInRight: 'drawerSlideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                drawerSlideInLeft: 'drawerSlideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                kenBurns: 'kenBurns 25s ease-in-out infinite alternate'
            },
        },
    },
    plugins: [],
}
