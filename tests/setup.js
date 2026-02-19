/**
 * Jest test setup file
 * Configures global mocks and test environment
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => {
      return store[key] || null;
    },
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Reset DOM and localStorage before each test
beforeEach(() => {
  // Clear localStorage
  localStorageMock.clear();

  // Reset document body
  if (document.body) {
    document.body.innerHTML = '';
    document.body.className = '';
  }
});

// Setup global constants mock
global.Constants = {
  STORAGE_KEYS: {
    CURRENT_VIEW: 'bailustory_current_view',
    THEME: 'bailustory_theme',
    STORY_DATA: 'bailustory_story_data'
  },
  ITEM_TYPES: {
    other: '其他',
    weapon: '武器',
    armor: '护甲',
    tool: '工具',
    quest: '任务物品'
  },
  SETTING_TYPES: {
    location: '地点',
    region: '区域',
    world: '世界'
  },
  PROMPT_TEMPLATES: {
    default: 'default',
    'character-focus': 'character-focus',
    'scene-setup': 'scene-setup'
  }
};
