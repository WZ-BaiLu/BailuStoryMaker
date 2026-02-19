/**
 * ThemeManager
 * Manages theme switching and persistence
 */
class ThemeManager {
    /**
     * Create a ThemeManager instance
     */
    constructor() {
    }

    /**
     * Load theme from localStorage and apply to body
     */
    loadTheme() {
        const theme = localStorage.getItem(Constants.STORAGE_KEYS.THEME) || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark');
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        document.body.classList.toggle('dark');
        const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem(Constants.STORAGE_KEYS.THEME, theme);
    }

    /**
     * Get the current theme
     * @returns {'light'|'dark'} The current theme
     */
    getCurrentTheme() {
        return document.body.classList.contains('dark') ? 'dark' : 'light';
    }
}
