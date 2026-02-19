# Multi-Language Support - Tasks

## 1. Create I18nManager Module [x]
Create `js/modules/I18nManager.js` with the following capabilities:
- Load translation files from `locales/` directory
- Store current language and fallback language
- Provide `t(key)` method for translation lookup
- Emit events when language changes
- Apply translations to DOM elements with `data-i18n` attributes
- Persist language preference to localStorage

## 2. Create Translation Resources [x]
Create `locales/` directory with:
- `zh-CN.json`: Complete Chinese translations
- `en-US.json`: Complete English translations
Include translations for:
- Navigation items
- Button labels
- Form placeholders
- Modal text
- Status messages
- Header and footer elements

## 3. Update HTML with i18n Attributes [x]
Add `data-i18n` attributes to all translatable elements:
- Sidebar navigation
- Header buttons
- Form labels and placeholders
- Modal content
- View titles and headings
- Empty state messages
Update title tag to "BailuStoryMaker"

## 4. Add Language Switcher UI [x]
Add language selector dropdown:
- Place in sidebar footer (below new story button)
- Options: "简体中文" and "English"
- On selection: call `I18nManager.setLanguage()` and update UI
- Show current language as selected

## 5. Integrate I18nManager with App [x]
In `js/app.js`:
- Initialize I18nManager before DOM manipulation
- Load saved language preference or use browser default
- Subscribe to language change events to update UI
- Call `applyTranslations()` after view switches

## 6. Update Title and Branding [x]
Update all branding text to "BailuStoryMaker":
- HTML title tag
- Sidebar header (keep 🦌 emoji)
- Any welcome messages or documentation

## 7. Test Language Switching [x]
Verify:
- Language switching updates all UI elements correctly
- No hardcoded text remains
- Language preference persists on page reload
- Both languages display properly
- Deer emoji and "BailuStoryMaker" brand are consistent

## 8. Update Project Standards [x]
Document i18n conventions in project standards:
- How to add new translations
- Translation key naming conventions
- Adding new languages to the project
