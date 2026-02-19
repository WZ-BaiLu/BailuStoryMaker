# Spec: Multi-Language Support

## Architecture

### I18nManager Module
```javascript
class I18nManager {
    constructor() {
        this.currentLang = 'zh-CN';
        this.fallbackLang = 'zh-CN';
        this.translations = {};
        this.eventBus = new EventTarget();
    }

    async loadLanguage(lang) { ... }
    t(key, params = {}) { ... }
    setLanguage(lang) { ... }
    applyTranslations() { ... }
    onLanguageChange(callback) { ... }
}
```

### Translation File Structure
```json
{
    "nav": {
        "story": "故事",
        "character": "角色",
        "item": "道具",
        "setting": "设定",
        "prompt": "提示词"
    },
    "buttons": {
        "save": "保存",
        "load": "加载",
        "export": "导出",
        "import": "导入"
    },
    ...
}
```

## HTML Integration

### Translation Keys Pattern
- Use dot notation for nested keys: `nav.story`, `buttons.save`
- Apply to elements: `<span data-i18n="nav.story">故事</span>`
- Placeholder support: `<input data-i18n-placeholder="chapter.title">`

### Language Switcher Location
Place in sidebar footer:
```html
<div class="sidebar-footer">
    <button id="new-story-btn" class="btn btn-primary">新建故事</button>
    <select id="lang-selector" class="lang-selector">
        <option value="zh-CN">简体中文</option>
        <option value="en-US">English</option>
    </select>
    <div id="save-status" class="save-status"></div>
</div>
```

## Language Detection Priority
1. User preference from localStorage
2. Browser language (`navigator.language`)
3. Fallback to `zh-CN`

## Translation Key Naming Conventions
- Use lowercase with dots: `nav.story`
- Group by context: `nav.*`, `buttons.*`, `forms.*`, `messages.*`
- Use descriptive, human-readable keys
- Avoid abbreviations

## Adding New Languages
1. Create new translation file in `locales/` directory (e.g., `ja-JP.json`)
2. Add option to language selector
3. Ensure all keys are present

## Branding Guidelines
- Always use "BailuStoryMaker" for text brand
- Keep deer emoji 🦌 in branding elements
- Example: "🦌 BailuStoryMaker"
