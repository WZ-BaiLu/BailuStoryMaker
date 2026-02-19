# Proposal: Multi-Language Support

## Summary
Add internationalization (i18n) support to BailuStoryMaker, enabling users to switch between multiple languages (e.g., Chinese and English). The feature will include language switching UI, translation resource management, and consistent localization across all UI elements.

## Motivation
- Make the tool accessible to a global audience
- Support bilingual users who may prefer English or Chinese interface
- Align with modern web application standards for internationalization

## Goals
1. Implement a flexible i18n system supporting multiple languages
2. Add language switcher to the UI (sidebar header)
3. Extract all hardcoded text into translation resources
4. Support Chinese (zh-CN) and English (en-US) initially
5. Persist language preference in local storage
6. Keep the deer emoji (🦌) in the branding
7. Use "BailuStoryMaker" as the unified text brand name

## Non-Goals
- RTL (right-to-left) language support at this stage
- Auto-translation of story content (only UI translation)
- User-generated content translation

## Design Overview
- Create an `I18nManager` module to handle language loading, switching, and translation lookup
- Store translations in JSON files under `locales/` directory
- Use data attributes (e.g., `data-i18n="nav.story"`) in HTML to mark translatable elements
- Initialize I18nManager on app startup and apply translations to DOM
- Add language selector dropdown in sidebar footer

## Key Changes
- New `js/modules/I18nManager.js` module
- New `locales/` directory with `zh-CN.json` and `en-US.json`
- Updated HTML with `data-i18n` attributes
- Updated title tag to use "BailuStoryMaker" brand
- Integration with existing app initialization flow

## Success Criteria
- Language switching works without page reload
- All UI elements are translatable
- Language preference persists across sessions
- Brand name consistently uses "BailuStoryMaker"
- Deer emoji (🦌) remains in branding
