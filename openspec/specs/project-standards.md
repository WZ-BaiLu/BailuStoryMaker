# BailuStoryMaker - Project Standards

## Overview
This document outlines the coding standards, conventions, and best practices for the BailuStoryMaker project.

## Technology Stack
- **Frontend**: Pure HTML, CSS, JavaScript (Vanilla)
- **Architecture**: Modular JavaScript with class-based components
- **State Management**: Custom State Manager with history/undo-redo support
- **Internationalization**: Custom I18nManager for multi-language support
- **Storage**: LocalStorage for persistence, JSON file import/export

## Project Structure
```
BailuStory/
├── css/                 # Stylesheets
│   ├── main.css         # Main styles
│   ├── components.css   # Component-specific styles
│   └── themes.css       # Theme (light/dark) styles
├── js/
│   ├── utils/           # Utility modules
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── modules/         # Feature modules
│   │   ├── I18nManager.js    # Internationalization
│   │   ├── FileManager.js
│   │   ├── ContextBuilder.js
│   │   ├── MemoryManager.js
│   │   ├── PromptGenerator.js
│   │   └── HistoryManager.js
│   ├── state.js         # Global state management
│   └── app.js           # Main application entry point
├── locales/             # Translation files
│   ├── zh-CN.json       # Chinese translations
│   └── en-US.json       # English translations
├── templates/           # Templates (if any)
└── openspec/            # OpenSpec change management
    ├── changes/         # Active changes
    ├── specs/           # Specifications
    └── config.yaml      # OpenSpec configuration
```

## Coding Conventions

### JavaScript
- **Class Naming**: PascalCase (e.g., `I18nManager`, `FileManager`)
- **Function/Method Naming**: camelCase (e.g., `initI18n()`, `loadLanguage()`)
- **Constant Naming**: UPPER_SNAKE_CASE (e.g., `STORAGE_KEYS`, `ITEM_TYPES`)
- **Variable Naming**: camelCase (e.g., `currentLang`, `translations`)
- **Indentation**: 4 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes for strings, double quotes for JSON

### HTML
- **Element Naming**: kebab-case for IDs and classes
- **Data Attributes**: Use `data-i18n` for translations
- **Semantic HTML**: Use proper semantic elements (`nav`, `header`, `main`, etc.)

### CSS
- **Class Naming**: kebab-case (e.g., `.lang-selector`, `.sidebar-header`)
- **Variables**: Use CSS custom properties with `--prefix`
- **Units**: Use relative units (rem, em, %) where appropriate

## Internationalization (i18n) Standards

### Translation Key Naming
- Use dot notation for nested keys: `nav.story`, `buttons.save`
- Group by context: `nav.*`, `buttons.*`, `forms.*`, `messages.*`
- Use descriptive, human-readable keys
- Avoid abbreviations

### Adding Translations
1. Add keys to both `zh-CN.json` and `en-US.json`
2. Use data attributes in HTML: `<span data-i18n="nav.story">故事</span>`
3. For placeholders: `<input data-i18n-placeholder="form.email" placeholder="邮箱">`
4. For dynamic content in JS: `i18n.t('message.welcome', { name: user })`

### Language Detection Priority
1. User preference from localStorage (`bailuStoryLang`)
2. Browser language (`navigator.language`)
3. Fallback to `zh-CN`

### Adding New Languages
1. Create new translation file in `locales/` directory (e.g., `ja-JP.json`)
2. Copy structure from existing language files
3. Add option to language selector in HTML
4. Add language code to `I18nManager.availableLangs`

## Branding Guidelines
- **Brand Name**: Always use "BailuStoryMaker" for text brand
- **Logo Emoji**: Keep deer emoji 🦌 in branding elements
- **Display Format**: "🦌 BailuStoryMaker" (emoji + brand name)
- **HTML Title**: "🦌 BailuStoryMaker - AI 辅助小说编写工具" (or English equivalent)

## State Management
- Use `appState` as global state instance
- State changes emit events for UI updates
- History/undo-redo support for all mutations
- LocalStorage persistence for auto-save

## File Naming Conventions
- JavaScript files: PascalCase for modules, camelCase for utilities
- CSS files: kebab-case
- Translation files: `{lang}.json` (e.g., `zh-CN.json`, `en-US.json`)
- OpenSpec artifacts: kebab-case filenames in markdown

## Git Workflow
- Use conventional commit messages
- Feature branches: `feature/feature-name`
- OpenSpec changes managed in `openspec/changes/`
- Archive completed changes after merging

## OpenSpec Workflow
- Use `openspec-new-change` to start new features
- Create proposal, spec, and tasks artifacts
- Implement according to tasks.md
- Verify implementation matches spec
- Archive completed changes

## Documentation Standards
- Code comments should explain "why", not "what"
- Update README for user-facing changes
- Document complex algorithms in separate markdown files
- Keep OpenSpec artifacts up-to-date

## Testing (Future)
- Unit tests for utility functions
- Integration tests for critical user flows
- i18n coverage tests (ensure all keys are translated)
- Cross-browser testing

## Performance Guidelines
- Minimize DOM manipulations
- Use event delegation where appropriate
- Lazy load translation files on demand
- Debounce expensive operations

## Accessibility
- Use semantic HTML
- Ensure keyboard navigation works
- Provide alt text for images
- Maintain proper color contrast ratios
- i18n should not break screen readers

## Security Considerations
- Validate all user inputs
- Sanitize content before rendering
- No eval() or dangerous functions
- LocalStorage data is not encrypted (document this limitation)
