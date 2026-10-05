export {}

declare global {
    interface Window {
        cleardShell?: {
            platform: string
            setTheme(theme: { background: string; foreground: string; colorScheme: 'light' | 'dark' }): void
        }
    }
}
