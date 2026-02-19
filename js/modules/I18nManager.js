/**
 * I18nManager - Internationalization Manager
 * Handles language loading, translation lookup, and UI updates
 */
class I18nManager {
    constructor() {
        this.currentLang = 'zh-CN';
        this.fallbackLang = 'zh-CN';
        this.translations = {};
        this.eventBus = new EventTarget();
        this.availableLangs = ['zh-CN', 'en-US'];
    }

    /**
     * Initialize the i18n manager and load translations
     */
    async init() {
        console.log('I18nManager initializing...');

        // Load embedded translations first
        this.loadEmbeddedTranslations();

        // Try to load saved language preference
        const savedLang = localStorage.getItem('bailuStoryLang');
        console.log('Saved language from localStorage:', savedLang);
        if (savedLang && this.availableLangs.includes(savedLang)) {
            this.currentLang = savedLang;
        } else {
            // Fallback to browser language
            const browserLang = navigator.language || navigator.userLanguage;
            console.log('Browser language:', browserLang);
            if (browserLang.startsWith('en')) {
                this.currentLang = 'en-US';
            }
        }
        console.log('Initial language set to:', this.currentLang);

        // Try to load from external JSON files (works with HTTP server)
        await this.loadLanguage(this.currentLang);
        console.log('Translations loaded for:', this.currentLang);
    }

    /**
     * Load embedded translations (fallback for file:// protocol)
     */
    loadEmbeddedTranslations() {
        // Chinese translations
        this.translations['zh-CN'] = {
          "app": {
            "title": "🦌 BailuStoryMaker - AI 辅助小说编写工具"
          },
          "brand": {
            "name": "🦌 BailuStoryMaker"
          },
          "nav": {
            "story": "故事",
            "character": "角色",
            "item": "道具",
            "setting": "设定",
            "prompt": "提示词"
          },
          "buttons": {
            "newStory": "新建故事",
            "save": "保存",
            "load": "加载",
            "export": "导出",
            "import": "导入",
            "undo": "撤销",
            "redo": "重做",
            "addChapter": "添加章节",
            "addCharacter": "添加角色",
            "addItem": "添加道具",
            "addSetting": "添加设定",
            "saveCharacter": "保存角色",
            "saveItem": "保存道具",
            "saveSetting": "保存设定",
            "generatePrompt": "生成提示词",
            "copyPrompt": "复制到剪贴板",
            "confirm": "确认",
            "cancel": "取消"
          },
          "header": {
            "noStoryLoaded": "未加载故事"
          },
          "story": {
            "chapters": "章节",
            "chapterTitle": "章节标题",
            "chapterContent": "开始编写你的故事...",
            "selectChapter": "请从左侧选择一个章节或创建新章节"
          },
          "character": {
            "list": "角色列表",
            "details": "角色详情",
            "name": "角色名称",
            "description": "角色描述",
            "attributes": "属性",
            "abilities": "能力",
            "addAttribute": "添加属性",
            "addAbility": "添加能力",
            "notes": "备注",
            "selectCharacter": "请从左侧选择一个角色或创建新角色"
          },
          "item": {
            "list": "道具列表",
            "details": "道具详情",
            "name": "道具名称",
            "type": "类型",
            "description": "道具描述",
            "properties": "属性",
            "addProperty": "添加属性",
            "selectItem": "请从左侧选择一个道具或创建新道具",
            "typeOther": "其他",
            "typeWeapon": "武器",
            "typeArmor": "护甲",
            "typeTool": "工具",
            "typeQuest": "任务物品"
          },
          "setting": {
            "list": "设定列表",
            "details": "设定详情",
            "name": "设定名称",
            "type": "类型",
            "description": "设定描述",
            "selectSetting": "请从左侧选择一个设定或创建新设定",
            "noParent": "无父级",
            "typeLocation": "地点",
            "typeRegion": "区域",
            "typeWorld": "世界"
          },
          "prompt": {
            "title": "提示词生成",
            "selectChapter": "选择章节",
            "template": "模板",
            "generated": "生成的提示词",
            "templateDefault": "默认模板",
            "templateCharacter": "角色聚焦",
            "templateScene": "场景设定"
          },
          "modal": {
            "newStory": "新建故事",
            "enterName": "输入名称"
          },
          "status": {
            "saved": "已保存",
            "unsaved": "未保存",
            "saving": "保存中..."
          },
          "placeholder": {
            "chapter": "请从左侧选择一个章节或创建新章节",
            "character": "请从左侧选择一个角色或创建新角色",
            "item": "请从左侧选择一个道具或创建新道具",
            "setting": "请从左侧选择一个设定或创建新设定",
            "inputName": "输入名称"
          },
          "language": {
            "zhCN": "简体中文",
            "enUS": "English"
          },
          "messages": {
            "saveSuccess": "保存成功！",
            "loadSuccess": "加载成功！",
            "storyCreated": "故事创建成功！",
            "characterSaved": "角色保存成功！",
            "itemSaved": "道具保存成功！",
            "settingSaved": "设定保存成功！",
            "promptCopied": "提示词已复制到剪贴板",
            "undoSuccess": "已撤销",
            "redoSuccess": "已重做",
            "welcomeMessage": "欢迎使用白鹿故事",
            "createOrLoadStory": "请先创建或加载一个故事",
            "noStoryLoaded": "请先加载一个故事",
            "storyRestored": "已恢复上次的故事",
            "confirmDeleteChapter": "确定要删除这个章节吗？",
            "confirmDeleteCharacter": "确定要删除这个角色吗？",
            "confirmDeleteItem": "确定要删除这个道具吗？",
            "confirmDeleteSetting": "确定要删除这个设定吗？",
            "noChapters": "暂无章节",
            "noCharacters": "暂无角色",
            "noItems": "暂无道具",
            "noSettings": "暂无设定",
            "inputStoryTitle": "输入故事标题"
          },
          "placeholders": {
            "attributeName": "属性名",
            "attributeValue": "属性值",
            "abilityName": "能力名称",
            "abilityLevel": "等级",
            "abilityDesc": "能力描述",
            "propertyName": "属性名",
            "propertyValue": "属性值",
            "delete": "删除"
          }
        };

        // English translations
        this.translations['en-US'] = {
          "app": {
            "title": "🦌 BailuStoryMaker - AI-Assisted Novel Writing Tool"
          },
          "brand": {
            "name": "🦌 BailuStoryMaker"
          },
          "nav": {
            "story": "Story",
            "character": "Character",
            "item": "Item",
            "setting": "Setting",
            "prompt": "Prompt"
          },
          "buttons": {
            "newStory": "New Story",
            "save": "Save",
            "load": "Load",
            "export": "Export",
            "import": "Import",
            "undo": "Undo",
            "redo": "Redo",
            "addChapter": "Add Chapter",
            "addCharacter": "Add Character",
            "addItem": "Add Item",
            "addSetting": "Add Setting",
            "saveCharacter": "Save Character",
            "saveItem": "Save Item",
            "saveSetting": "Save Setting",
            "generatePrompt": "Generate Prompt",
            "copyPrompt": "Copy to Clipboard",
            "confirm": "Confirm",
            "cancel": "Cancel"
          },
          "header": {
            "noStoryLoaded": "No Story Loaded"
          },
          "story": {
            "chapters": "Chapters",
            "chapterTitle": "Chapter Title",
            "chapterContent": "Start writing your story...",
            "selectChapter": "Please select a chapter from the left or create a new one"
          },
          "character": {
            "list": "Character List",
            "details": "Character Details",
            "name": "Character Name",
            "description": "Character Description",
            "attributes": "Attributes",
            "abilities": "Abilities",
            "addAttribute": "Add Attribute",
            "addAbility": "Add Ability",
            "notes": "Notes",
            "selectCharacter": "Please select a character from the left or create a new one"
          },
          "item": {
            "list": "Item List",
            "details": "Item Details",
            "name": "Item Name",
            "type": "Type",
            "description": "Item Description",
            "properties": "Properties",
            "addProperty": "Add Property",
            "selectItem": "Please select an item from the left or create a new one",
            "typeOther": "Other",
            "typeWeapon": "Weapon",
            "typeArmor": "Armor",
            "typeTool": "Tool",
            "typeQuest": "Quest Item"
          },
          "setting": {
            "list": "Setting List",
            "details": "Setting Details",
            "name": "Setting Name",
            "type": "Type",
            "description": "Setting Description",
            "selectSetting": "Please select a setting from the left or create a new one",
            "noParent": "No Parent",
            "typeLocation": "Location",
            "typeRegion": "Region",
            "typeWorld": "World"
          },
          "prompt": {
            "title": "Prompt Generation",
            "selectChapter": "Select Chapter",
            "template": "Template",
            "generated": "Generated Prompt",
            "templateDefault": "Default Template",
            "templateCharacter": "Character Focus",
            "templateScene": "Scene Setup"
          },
          "modal": {
            "newStory": "New Story",
            "enterName": "Enter Name"
          },
          "status": {
            "saved": "Saved",
            "unsaved": "Unsaved",
            "saving": "Saving..."
          },
          "placeholder": {
            "chapter": "Please select a chapter from the left or create a new one",
            "character": "Please select a character from the left or create a new one",
            "item": "Please select an item from the left or create a new one",
            "setting": "Please select a setting from the left or create a new one",
            "inputName": "Enter Name"
          },
          "language": {
            "zhCN": "简体中文",
            "enUS": "English"
          },
          "messages": {
            "saveSuccess": "Saved successfully!",
            "loadSuccess": "Loaded successfully!",
            "storyCreated": "Story created successfully!",
            "characterSaved": "Character saved successfully!",
            "itemSaved": "Item saved successfully!",
            "settingSaved": "Setting saved successfully!",
            "promptCopied": "Prompt copied to clipboard",
            "undoSuccess": "Undone",
            "redoSuccess": "Redone",
            "welcomeMessage": "Welcome to BailuStoryMaker",
            "createOrLoadStory": "Please create or load a story first",
            "noStoryLoaded": "Please load a story first",
            "storyRestored": "Last story restored",
            "confirmDeleteChapter": "Are you sure you want to delete this chapter?",
            "confirmDeleteCharacter": "Are you sure you want to delete this character?",
            "confirmDeleteItem": "Are you sure you want to delete this item?",
            "confirmDeleteSetting": "Are you sure you want to delete this setting?",
            "noChapters": "No chapters yet",
            "noCharacters": "No characters yet",
            "noItems": "No items yet",
            "noSettings": "No settings yet",
            "inputStoryTitle": "Enter story title"
          },
          "placeholders": {
            "attributeName": "Attribute name",
            "attributeValue": "Attribute value",
            "abilityName": "Ability name",
            "abilityLevel": "Level",
            "abilityDesc": "Ability description",
            "propertyName": "Property name",
            "propertyValue": "Property value",
            "delete": "Delete"
          }
        };
    }

    /**
     * Load translation file for a specific language (works with HTTP server)
     */
    async loadLanguage(lang) {
        // Skip fetch for file:// protocol (CORS restriction)
        if (window.location.protocol === 'file:') {
            console.log('File protocol detected, using embedded translations only');
            return true;
        }

        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}`);
            }
            const externalTranslations = await response.json();
            // Merge external translations with embedded ones
            this.translations[lang] = { ...this.translations[lang], ...externalTranslations };
            return true;
        } catch (error) {
            console.warn('Failed to load external translations, using embedded ones:', error.message);
            // If external loading fails, we already have embedded translations
            return true;
        }
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key (e.g., 'nav.story')
     * @param {object} params - Parameters to interpolate into the translation
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        // Navigate through nested keys
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Try fallback language
                value = this.translations[this.fallbackLang];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        console.warn(`Translation key not found: ${key}`);
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }

        // Handle string interpolation
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            value = value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }

        return typeof value === 'string' ? value : key;
    }

    /**
     * Set current language
     */
    async setLanguage(lang) {
        console.log('setLanguage called with:', lang);
        if (!this.availableLangs.includes(lang)) {
            console.error(`Language ${lang} is not available`);
            return false;
        }

        if (lang === this.currentLang) {
            console.log('Language already set to:', lang);
            return true;
        }

        // Load new language if not already loaded
        if (!this.translations[lang]) {
            console.log('Loading translations for:', lang);
            const loaded = await this.loadLanguage(lang);
            if (!loaded) {
                console.error('Failed to load translations for:', lang);
                return false;
            }
        }

        const oldLang = this.currentLang;
        this.currentLang = lang;
        localStorage.setItem('bailuStoryLang', lang);
        console.log('Language changed from', oldLang, 'to', lang);

        // Emit language change event
        this.eventBus.dispatchEvent(new CustomEvent('languageChange', {
            detail: { oldLang, newLang: lang }
        }));

        return true;
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return this.availableLangs;
    }

    /**
     * Apply translations to DOM elements with data-i18n attributes
     */
    applyTranslations() {
        console.log('Applying translations for language:', this.currentLang);
        // Apply to text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Apply to placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Apply to titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Apply to values (for inputs)
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
            const key = el.getAttribute('data-i18n-value');
            el.value = this.t(key);
        });

        // Update page title
        const titleEl = document.querySelector('title');
        if (titleEl) {
            titleEl.textContent = this.t('app.title');
        }
    }

    /**
     * Subscribe to language change events
     */
    onLanguageChange(callback) {
        const handler = (event) => callback(event.detail);
        this.eventBus.addEventListener('languageChange', handler);
        return () => {
            this.eventBus.removeEventListener('languageChange', handler);
        };
    }

    /**
     * Reload all translations (useful for hot-reloading during development)
     */
    async reload() {
        await this.loadLanguage(this.currentLang);
        this.applyTranslations();
    }
}

// Create singleton instance
const i18n = new I18nManager();
