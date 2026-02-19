// Main Application Entry Point

class App {
    constructor() {
        this.state = appState;

        // Initialize managers
        this.notificationManager = new NotificationManager();
        this.themeManager = new ThemeManager();
        this.modalManager = new ModalManager(this, this.state);
        this.exportImportManager = new ExportImportManager(this, this.state);
        this.viewManager = new ViewManager(this, this.state);
        this.eventManager = new EventManager(this, this.state);
        this.uiRenderer = new UIRenderer(this, this.state);

        this.init();
    }

    async init() {
        await this.initI18n();
        this.bindEvents();
        this.loadTheme();
        this.setupKeyboardShortcuts();
        this.showWelcomeMessage();
    }

    async initI18n() {
        await i18n.init();
        this.initLanguageSelector();
        i18n.applyTranslations();
        i18n.onLanguageChange(() => {
            i18n.applyTranslations();
            this.updateStoryTitle();
            this.viewManager.refreshCurrentView();
        });
    }

    initLanguageSelector() {
        const langSelector = document.getElementById('lang-selector');
        if (langSelector) {
            langSelector.value = i18n.getCurrentLanguage();
            langSelector.addEventListener('change', async (e) => {
                console.log('Language changed to:', e.target.value);
                await i18n.setLanguage(e.target.value);
                console.log('Current language after change:', i18n.getCurrentLanguage());
            });
        }
    }

    setupKeyboardShortcuts() {
        this.eventManager.setupKeyboardShortcuts();
    }

    bindEvents() {
        this.eventManager.bindEvents();
    }

    // Story management (delegated to managers)
    handleExport() {
        this.exportImportManager.handleExport();
    }

    handleImport() {
        this.exportImportManager.handleImport();
    }

    showNewStoryModal() {
        this.modalManager.showNewStoryModal();
    }

    hideModal() {
        this.modalManager.hideModal();
    }

    handleModalSubmit(e) {
        this.modalManager.handleModalSubmit(e);
    }

    onStoryLoaded() {
        const story = this.state.currentStory;
        document.getElementById('story-title').textContent = story.metadata.title;
        this.uiRenderer.renderChapters();
        this.uiRenderer.renderCharacters();
        this.uiRenderer.renderItems();
        this.uiRenderer.renderSettings();

        // Restore selected items in editors
        if (this.state.selectedChapter) {
            this.uiRenderer.renderChapterEditor(this.state.selectedChapter);
        }
        if (this.state.selectedCharacter) {
            this.uiRenderer.renderCharacterEditor(this.state.selectedCharacter);
        }
        if (this.state.selectedItem) {
            this.uiRenderer.renderItemEditor(this.state.selectedItem);
        }
        if (this.state.selectedSetting) {
            this.uiRenderer.renderSettingEditor(this.state.selectedSetting);
        }

        // Only switch to story view if no saved view
        const savedView = localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW);
        if (!savedView) {
            this.viewManager.switchView('story');
        }

        // Enable auto-save if configured
        if (story.settings && story.settings.autoSave) {
            const interval = (story.settings.autoSaveInterval || 300) * 1000;
            this.state.enableAutoSave(interval);
        }
    }

    updateStoryTitle() {
        const story = this.state.currentStory;
        const titleEl = document.getElementById('story-title');
        if (story) {
            titleEl.textContent = story.metadata.title;
        } else {
            titleEl.textContent = i18n.t('header.noStoryLoaded');
        }
    }

    // Chapter management
    addChapter() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const chapter = this.state.addChapter(i18n.t('messages.noChapters'));
        this.state.selectChapter(chapter.id);
        this.uiRenderer.renderChapters();
        this.uiRenderer.renderChapterEditor(chapter.id);
    }

    // Paragraph management
    handleNewParagraph() {
        if (!this.state.selectedChapter) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }

        const input = document.getElementById('new-paragraph-input');
        const content = input.value.trim();

        if (!content) {
            return;
        }

        this.state.addParagraph(this.state.selectedChapter);

        const chapter = this.state.currentStory.chapters.find(c => c.id === this.state.selectedChapter);
        if (chapter && chapter.paragraphs.length > 0) {
            const lastParagraph = chapter.paragraphs[chapter.paragraphs.length - 1];
            this.state.updateParagraph(this.state.selectedChapter, lastParagraph.id, { content });
        }

        input.value = '';
        this.uiRenderer.renderParagraphs();
    }

    // Character management
    addCharacter() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const character = this.state.addCharacter({ name: i18n.t('messages.noCharacters') });
        this.state.selectCharacter(character.id);
        this.uiRenderer.renderCharacters();
        this.uiRenderer.renderCharacterEditor(character.id);
    }

    saveCharacter(e) {
        e.preventDefault();
        if (!this.state.selectedCharacter) return;

        const characterId = this.state.selectedCharacter;
        const name = document.getElementById('char-name').value;
        const description = document.getElementById('char-description').value;
        const notes = document.getElementById('char-notes').value;

        const attributes = { current: {} };
        document.querySelectorAll('#char-attributes .attribute-entry').forEach(entry => {
            const attrName = entry.querySelector('.attr-name').value.trim();
            const attrValue = entry.querySelector('.attr-value').value.trim();
            if (attrName && attrValue) {
                attributes.current[attrName] = attrValue;
            }
        });

        const abilities = [];
        document.querySelectorAll('#char-abilities .ability-entry').forEach(entry => {
            const abilityName = entry.querySelector('.ability-name').value.trim();
            const abilityLevel = entry.querySelector('.ability-level').value;
            const abilityDesc = entry.querySelector('.ability-desc').value.trim();
            if (abilityName) {
                abilities.push({
                    name: abilityName,
                    level: parseInt(abilityLevel) || 1,
                    description: abilityDesc
                });
            }
        });

        this.state.updateCharacter(characterId, { name, description, notes, attributes, abilities });
        this.notificationManager.showSuccess(i18n.t('messages.characterSaved'));
        this.uiRenderer.renderCharacters();
    }

    addAttribute() {
        const container = document.getElementById('char-attributes');
        const entry = document.createElement('div');
        entry.className = 'attribute-entry';
        entry.innerHTML = `
            <input type="text" class="input-field attr-name" placeholder="${i18n.t('placeholders.attributeName')}">
            <input type="text" class="input-field attr-value value-input" placeholder="${i18n.t('placeholders.attributeValue')}">
            <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
        `;
        container.appendChild(entry);

        entry.querySelector('.btn-delete').addEventListener('click', () => {
            entry.remove();
        });
    }

    addAbility() {
        const container = document.getElementById('char-abilities');
        const entry = document.createElement('div');
        entry.className = 'ability-entry';
        entry.innerHTML = `
            <div class="ability-header">
                <input type="text" class="input-field ability-name" placeholder="${i18n.t('placeholders.abilityName')}">
                <input type="number" class="input-field ability-level" placeholder="${i18n.t('placeholders.abilityLevel')}" min="1" value="1">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            </div>
            <input type="text" class="input-field ability-desc" placeholder="${i18n.t('placeholders.abilityDesc')}">
        `;
        container.appendChild(entry);

        entry.querySelector('.btn-delete').addEventListener('click', () => {
            entry.remove();
        });
    }

    // Item management
    addItem() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const item = this.state.addItem({ name: i18n.t('messages.noItems') });
        this.state.selectItem(item.id);
        this.uiRenderer.renderItems();
        this.uiRenderer.renderItemEditor(item.id);
    }

    saveItem(e) {
        e.preventDefault();
        if (!this.state.selectedItem) return;

        const itemId = this.state.selectedItem;
        const name = document.getElementById('item-name').value;
        const type = document.getElementById('item-type').value;
        const description = document.getElementById('item-description').value;

        this.state.updateItem(itemId, { name, type, description });
        this.notificationManager.showSuccess(i18n.t('messages.itemSaved'));
        this.uiRenderer.renderItems();
    }

    addProperty() {
        const container = document.getElementById('item-properties');
        const entry = document.createElement('div');
        entry.className = 'property-entry';
        entry.innerHTML = `
            <input type="text" class="input-field prop-name" placeholder="${i18n.t('placeholders.propertyName')}">
            <input type="text" class="input-field prop-value value-input" placeholder="${i18n.t('placeholders.propertyValue')}">
            <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
        `;
        container.appendChild(entry);

        entry.querySelector('.btn-delete').addEventListener('click', () => {
            entry.remove();
        });
    }

    // Setting management
    addSetting() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const setting = this.state.addSetting({ name: i18n.t('messages.noSettings') });
        this.state.selectSetting(setting.id);
        this.uiRenderer.renderSettings();
    }

    saveSetting(e) {
        e.preventDefault();
        if (!this.state.selectedSetting) return;

        const settingId = this.state.selectedSetting;
        const name = document.getElementById('setting-name').value;
        const type = document.getElementById('setting-type').value;
        const parentId = document.getElementById('setting-parent').value || null;
        const description = document.getElementById('setting-description').value;

        this.state.updateSetting(settingId, { name, type, parentId, description });
        this.notificationManager.showSuccess(i18n.t('messages.settingSaved'));
        this.uiRenderer.renderSettings();
    }

    // Prompt generation
    generatePrompt() {
        const story = this.state.currentStory;
        if (!story) {
            this.notificationManager.showError(i18n.t('messages.noStoryLoaded'));
            return;
        }

        const chapterId = document.getElementById('prompt-chapter').value;
        const templateName = document.getElementById('prompt-template').value;

        const contextBuilder = new ContextBuilder(story);
        const context = contextBuilder.buildContext(chapterId);

        const promptGenerator = new PromptGenerator(Constants.PROMPT_TEMPLATES);
        const prompt = promptGenerator.generatePrompt(context, templateName);

        document.getElementById('generated-prompt').value = prompt;
    }

    async copyPrompt() {
        const prompt = document.getElementById('generated-prompt');
        try {
            await navigator.clipboard.writeText(prompt.value);
            this.notificationManager.showSuccess(i18n.t('buttons.copyPrompt'));
        } catch (err) {
            const textarea = prompt;
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
            } catch (e) {
                console.error('Copy failed:', e);
                this.notificationManager.showError('复制失败');
                return;
            }
            this.notificationManager.showSuccess(i18n.t('buttons.copyPrompt'));
        }
    }

    // Theme management
    loadTheme() {
        this.themeManager.loadTheme();
    }

    toggleTheme() {
        this.themeManager.toggleTheme();
    }

    // Utility methods
    updateSaveStatus() {
        const statusEl = document.getElementById('save-status');
        statusEl.textContent = i18n.t('status.unsaved');
        statusEl.style.color = 'var(--warning-color)';
        setTimeout(() => {
            statusEl.textContent = i18n.t('status.saved');
            statusEl.style.color = 'var(--success-color)';
        }, 2000);
    }

    showWelcomeMessage() {
        document.getElementById('story-title').textContent = i18n.t('brand.name');

        if (this.state.loadFromLocalStorage()) {
            this.notificationManager.showSuccess(i18n.t('status.saved'));
        }

        this.viewManager.loadViewFromStorage();

        this.updateUndoRedoButtons();
    }

    // Undo/Redo handlers
    handleUndo() {
        this.eventManager.handleUndo();
    }

    handleRedo() {
        this.eventManager.handleRedo();
    }

    onStateRestored() {
        console.log('onStateRestored - currentStory:', this.state.currentStory);

        const story = this.state.currentStory;
        if (story) {
            document.getElementById('story-title').textContent = story.metadata.title;

            console.log('onStateRestored - selectedChapter:', this.state.selectedChapter, 'chapters:', story.chapters.map(c => ({id: c.id, title: c.title})));

            if (this.state.selectedChapter && !story.chapters.find(c => c.id === this.state.selectedChapter)) {
                console.log('Selected chapter not found, clearing');
                this.state.selectedChapter = null;
            }
            if (this.state.selectedCharacter && !story.characters.find(c => c.id === this.state.selectedCharacter)) {
                this.state.selectedCharacter = null;
            }
            if (this.state.selectedItem && !story.items.find(i => i.id === this.state.selectedItem)) {
                this.state.selectedItem = null;
            }
            if (this.state.selectedSetting && !story.settings.find(s => s.id === this.state.selectedSetting)) {
                this.state.selectedSetting = null;
            }
        } else {
            console.error('Story is undefined after undo/redo!');
        }

        this.viewManager.refreshCurrentView();
        this.updateUndoRedoButtons();
        this.updateSaveStatus();
    }

    updateUndoRedoButtons() {
        const status = this.state.getHistoryStatus();
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = !status.canUndo;
            undoBtn.title = status.canUndo ? `撤销 (${status.undoCount}) - Ctrl+Z` : '无撤销操作';
        }

        if (redoBtn) {
            redoBtn.disabled = !status.canRedo;
            redoBtn.title = status.canRedo ? `重做 (${status.redoCount}) - Ctrl+Y` : '无重做操作';
        }
    }

    // Search functionality
    searchItems(type, query) {
        const story = this.state.currentStory;
        if (!story || !query) return [];

        query = query.toLowerCase();

        switch (type) {
            case 'character':
                return story.characters.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    (c.description && c.description.toLowerCase().includes(query))
                );
            case 'item':
                return story.items.filter(i =>
                    i.name.toLowerCase().includes(query) ||
                    (i.description && i.description.toLowerCase().includes(query))
                );
            case 'setting':
                return story.settings.filter(s =>
                    s.name.toLowerCase().includes(query) ||
                    (s.description && s.description.toLowerCase().includes(query))
                );
            default:
                return [];
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
