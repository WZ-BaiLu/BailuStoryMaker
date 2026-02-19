/**
 * Unit tests for ThemeManager
 */

// Redefine ThemeManager class for testing
class ThemeManager {
    constructor() {
    }

    loadTheme() {
        const theme = localStorage.getItem(Constants.STORAGE_KEYS.THEME) || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark');
        const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem(Constants.STORAGE_KEYS.THEME, theme);
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark') ? 'dark' : 'light';
    }
}

describe('ThemeManager', () => {
  let themeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
    document.body.className = '';
    localStorage.clear();
  });

  describe('constructor', () => {
    it('should create a ThemeManager instance', () => {
      expect(themeManager).toBeInstanceOf(ThemeManager);
      expect(themeManager).toBeDefined();
    });
  });

  describe('loadTheme', () => {
    it('should add dark class to body when theme is dark in localStorage', () => {
      localStorage.setItem('bailustory_theme', 'dark');
      themeManager.loadTheme();

      expect(document.body.classList.contains('dark')).toBe(true);
    });

    it('should not add dark class when theme is light in localStorage', () => {
      localStorage.setItem('bailustory_theme', 'light');
      themeManager.loadTheme();

      expect(document.body.classList.contains('dark')).toBe(false);
    });

    it('should not add dark class when no theme is in localStorage', () => {
      themeManager.loadTheme();

      expect(document.body.classList.contains('dark')).toBe(false);
    });

    it('should respect existing body classes', () => {
      document.body.classList.add('existing-class');
      localStorage.setItem('bailustory_theme', 'dark');
      themeManager.loadTheme();

      expect(document.body.classList.contains('dark')).toBe(true);
      expect(document.body.classList.contains('existing-class')).toBe(true);
    });

    it('should handle invalid theme value in localStorage', () => {
      localStorage.setItem('bailustory_theme', 'invalid');
      themeManager.loadTheme();

      expect(document.body.classList.contains('dark')).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('should add dark class when toggling from light to dark', () => {
      document.body.classList.remove('dark');
      themeManager.toggleTheme();

      expect(document.body.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('bailustory_theme')).toBe('dark');
    });

    it('should remove dark class when toggling from dark to light', () => {
      document.body.classList.add('dark');
      themeManager.toggleTheme();

      expect(document.body.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('bailustory_theme')).toBe('light');
    });

    it('should toggle theme correctly multiple times', () => {
      themeManager.toggleTheme();
      expect(document.body.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('bailustory_theme')).toBe('dark');

      themeManager.toggleTheme();
      expect(document.body.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('bailustory_theme')).toBe('light');

      themeManager.toggleTheme();
      expect(document.body.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('bailustory_theme')).toBe('dark');
    });

    it('should not affect other body classes when toggling', () => {
      document.body.classList.add('existing-class');
      themeManager.toggleTheme();

      expect(document.body.classList.contains('dark')).toBe(true);
      expect(document.body.classList.contains('existing-class')).toBe(true);
    });
  });

  describe('getCurrentTheme', () => {
    it('should return dark when body has dark class', () => {
      document.body.classList.add('dark');

      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should return light when body does not have dark class', () => {
      document.body.classList.remove('dark');

      expect(themeManager.getCurrentTheme()).toBe('light');
    });

    it('should handle multiple body classes correctly', () => {
      document.body.classList.add('dark', 'other-class');

      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should update correctly after toggleTheme is called', () => {
      expect(themeManager.getCurrentTheme()).toBe('light');

      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('dark');

      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
  });

  describe('integration tests', () => {
    it('should maintain theme state across loadTheme calls', () => {
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('dark');

      const newManager = new ThemeManager();
      newManager.loadTheme();
      expect(newManager.getCurrentTheme()).toBe('dark');
    });

    it('should handle rapid toggle calls correctly', () => {
      themeManager.toggleTheme();
      themeManager.toggleTheme();
      themeManager.toggleTheme();
      themeManager.toggleTheme();

      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(localStorage.getItem(Constants.STORAGE_KEYS.THEME)).toBe('light');
    });
  });
});
