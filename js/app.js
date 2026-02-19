// Main Application Entry Point

class App {
    constructor() {
        this.state = appState;
        this.currentView = 'story';
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
            // Re-render current view to update dynamic content
            this.refreshCurrentView();
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
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.handleSave();
            }

            // Ctrl/Cmd + N: New story
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showNewStoryModal();
            }

            // Ctrl/Cmd + O: Open (Load)
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.handleLoad();
            }

            // Ctrl/Cmd + Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.handleUndo();
            }

            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.handleRedo();
            }

            // Escape: Close modal
            if (e.key === 'Escape') {
                this.hideModal();
            }

            // Alt + 1-5: Switch views
            if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                const views = ['story', 'character', 'item', 'setting', 'prompt'];
                this.switchView(views[parseInt(e.key) - 1]);
            }
        });
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Header buttons
        document.getElementById('undo-btn').addEventListener('click', () => this.handleUndo());
        document.getElementById('redo-btn').addEventListener('click', () => this.handleRedo());
        document.getElementById('save-btn').addEventListener('click', () => this.handleSave());
        document.getElementById('load-btn').addEventListener('click', () => this.handleLoad());
        document.getElementById('export-btn').addEventListener('click', () => this.handleExport());
        document.getElementById('import-btn').addEventListener('click', () => this.handleImport());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Import input
        document.getElementById('import-input').addEventListener('change', (e) => this.handleImportFile(e));

        // New story button
        document.getElementById('new-story-btn').addEventListener('click', () => this.showNewStoryModal());

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-form').addEventListener('submit', (e) => this.handleModalSubmit(e));

        // Story view
        document.getElementById('add-chapter-btn').addEventListener('click', () => this.addChapter());
        document.getElementById('chapter-content').addEventListener('input', () => this.handleChapterEdit());

        // Character view
        document.getElementById('add-character-btn').addEventListener('click', () => this.addCharacter());
        document.getElementById('character-form').addEventListener('submit', (e) => this.saveCharacter(e));
        document.getElementById('add-attr-btn').addEventListener('click', () => this.addAttribute());
        document.getElementById('add-ability-btn').addEventListener('click', () => this.addAbility());

        // Item view
        document.getElementById('add-item-btn').addEventListener('click', () => this.addItem());
        document.getElementById('item-form').addEventListener('submit', (e) => this.saveItem(e));
        document.getElementById('add-prop-btn').addEventListener('click', () => this.addProperty());

        // Setting view
        document.getElementById('add-setting-btn').addEventListener('click', () => this.addSetting());
        document.getElementById('setting-form').addEventListener('submit', (e) => this.saveSetting(e));

        // Prompt view
        document.getElementById('generate-prompt-btn').addEventListener('click', () => this.generatePrompt());
        document.getElementById('copy-prompt-btn').addEventListener('click', () => this.copyPrompt());

        // State listeners
        this.state.on('storyLoaded', () => this.onStoryLoaded());
        this.state.on('chapterAdded', () => this.renderChapters());
        this.state.on('chapterUpdated', () => this.updateSaveStatus());
        this.state.on('characterAdded', () => this.renderCharacters());
        this.state.on('characterUpdated', () => this.updateSaveStatus());
        this.state.on('itemAdded', () => this.renderItems());
        this.state.on('itemUpdated', () => this.updateSaveStatus());
        this.state.on('settingAdded', () => this.renderSettings());
        this.state.on('settingUpdated', () => this.updateSaveStatus());
        this.state.on('stateRestored', () => this.onStateRestored());
        this.state.history.on('historyChanged', () => this.updateUndoRedoButtons());
    }

    handleNavigation(e) {
        const viewName = e.currentTarget.dataset.view;
        this.switchView(viewName);
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        this.currentView = viewName;

        // Save view to localStorage
        this.saveViewToStorage();

        // Render content
        switch (viewName) {
            case 'story':
                this.renderChapters();
                break;
            case 'character':
                this.renderCharacters();
                break;
            case 'item':
                this.renderItems();
                break;
            case 'setting':
                this.renderSettings();
                break;
            case 'prompt':
                this.renderPromptOptions();
                break;
        }
    }

    // Story management
    handleSave() {
        try {
            const story = this.state.saveStory();
            const filename = `${story.metadata.title}.json`;
            FileManager.saveAsJSON(story, filename);
            this.showToast(i18n.t('status.saved'), 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    handleLoad() {
        document.getElementById('import-input').click();
    }

    handleExport() {
        this.handleSave();
    }

    handleImport() {
        document.getElementById('import-input').click();
    }

    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const story = await FileManager.loadFromJSON(file);
            this.state.loadStory(story);
            this.showToast(i18n.t('status.saved'), 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }

        e.target.value = '';
    }

    showNewStoryModal() {
        document.getElementById('modal-title').textContent = i18n.t('modal.newStory');
        document.getElementById('modal-input').placeholder = i18n.t('placeholder.inputName');
        document.getElementById('modal-input').value = '';
        document.getElementById('modal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    handleModalSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('modal-input').value.trim();
        if (!title) return;

        const newStory = this.state.createStory(title);
        this.state.loadStory(newStory);
        this.hideModal();
        this.showToast(i18n.t('status.saved'), 'success');
    }

    onStoryLoaded() {
        const story = this.state.currentStory;
        document.getElementById('story-title').textContent = story.metadata.title;
        this.renderChapters();
        this.renderCharacters();
        this.renderItems();
        this.renderSettings();

        // Restore selected items in editors
        if (this.state.selectedChapter) {
            this.renderChapterEditor(this.state.selectedChapter);
        }
        if (this.state.selectedCharacter) {
            this.renderCharacterEditor(this.state.selectedCharacter);
        }
        if (this.state.selectedItem) {
            this.renderItemEditor(this.state.selectedItem);
        }
        if (this.state.selectedSetting) {
            this.renderSettingEditor(this.state.selectedSetting);
        }

        // Only switch to story view if no saved view
        const savedView = localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW);
        if (!savedView) {
            this.switchView('story');
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
            this.showToast(i18n.t('messages.createOrLoadStory'), 'error');
            return;
        }
        const chapter = this.state.addChapter(i18n.t('messages.noChapters'));
        this.state.selectChapter(chapter.id);
        this.renderChapters();
        this.renderChapterEditor(chapter.id);
    }

    renderChapters() {
        const container = document.getElementById('chapters');
        const story = this.state.currentStory;
        if (!story) return;

        container.innerHTML = story.chapters
            .sort((a, b) => a.order - b.order)
            .map(chapter => `
                <div class="list-item ${this.state.selectedChapter === chapter.id ? 'active' : ''}"
                     data-chapter-id="${chapter.id}">
                    <div class="list-item-header">
                        <span class="list-item-title">${chapter.order}. ${chapter.title}</span>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-delete" data-action="delete-chapter" data-chapter-id="${chapter.id}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const chapterId = item.dataset.chapterId;
                    console.log('Click chapter:', chapterId, 'Story:', this.state.currentStory);
                    this.state.selectChapter(chapterId);
                    this.renderChapters();
                    this.renderChapterEditor(chapterId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chapterId = btn.dataset.chapterId;
                if (confirm(i18n.t('messages.confirmDeleteChapter'))) {
                    this.state.deleteChapter(chapterId);
                    this.renderChapters();
                    if (this.state.selectedChapter === chapterId) {
                        this.state.selectChapter(null);
                        this.renderChapterEditor(null);
                    }
                }
            });
        });

        if (story.chapters.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📖</div><div class="empty-state-text">${i18n.t('messages.noChapters')}</div></div>`;
        }
    }

    renderChapterEditor(chapterId) {
        const contentPanel = document.getElementById('chapter-editor-content');
        const placeholderPanel = document.getElementById('chapter-editor-placeholder');
        const titleInput = document.getElementById('chapter-title');
        const contentInput = document.getElementById('chapter-content');
        const story = this.state.currentStory;

        console.log('renderChapterEditor called with chapterId:', chapterId, 'story:', story);

        if (!chapterId || !story) {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            return;
        }

        const chapter = story.chapters.find(c => c.id === chapterId);
        console.log('Found chapter:', chapter);
        if (chapter) {
            contentPanel.classList.remove('hidden');
            placeholderPanel.classList.remove('active');

            titleInput.value = chapter.title;
            contentInput.value = chapter.content || '';
            titleInput.disabled = false;
            contentInput.disabled = false;

            titleInput.oninput = () => {
                this.state.updateChapter(chapterId, { title: titleInput.value });
            };
        } else {
            // Chapter not found in current story (may have been deleted)
            console.log('Chapter not found in story');
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
        }
    }

    handleChapterEdit() {
        if (!this.state.selectedChapter) return;
        const content = document.getElementById('chapter-content').value;
        this.state.updateChapter(this.state.selectedChapter, { content });
    }

    // Character management
    addCharacter() {
        if (!this.state.currentStory) {
            this.showToast(i18n.t('messages.createOrLoadStory'), 'error');
            return;
        }
        const character = this.state.addCharacter({ name: i18n.t('messages.noCharacters') });
        this.state.selectCharacter(character.id);
        this.renderCharacters();
        this.renderCharacterEditor(character.id);
    }

    renderCharacters() {
        const container = document.getElementById('characters');
        const story = this.state.currentStory;
        if (!story) return;

        container.innerHTML = story.characters.map(character => `
            <div class="list-item ${this.state.selectedCharacter === character.id ? 'active' : ''}"
                 data-character-id="${character.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${character.name}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-character" data-character-id="${character.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const characterId = item.dataset.characterId;
                    this.state.selectCharacter(characterId);
                    this.renderCharacters();
                    this.renderCharacterEditor(characterId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const characterId = btn.dataset.characterId;
                if (confirm(i18n.t('messages.confirmDeleteCharacter'))) {
                    this.state.deleteCharacter(characterId);
                    this.renderCharacters();
                    if (this.state.selectedCharacter === characterId) {
                        this.state.selectCharacter(null);
                        this.renderCharacterEditor(null);
                    }
                }
            });
        });

        if (story.characters.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">${i18n.t('messages.noCharacters')}</div></div>`;
        }
    }

    renderCharacterEditor(characterId) {
        const contentPanel = document.getElementById('character-editor-content');
        const placeholderPanel = document.getElementById('character-editor-placeholder');
        const story = this.state.currentStory;

        if (!characterId || !story) {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearCharacterForm();
            return;
        }

        const character = story.characters.find(c => c.id === characterId);
        if (character) {
            contentPanel.classList.remove('hidden');
            placeholderPanel.classList.remove('active');

            document.getElementById('char-name').value = character.name;
            document.getElementById('char-description').value = character.description || '';
            document.getElementById('char-notes').value = character.notes || '';
            this.renderAttributes(character.attributes);
            this.renderAbilities(character.abilities);
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearCharacterForm();
        }
    }

    clearCharacterForm() {
        document.getElementById('char-name').value = '';
        document.getElementById('char-description').value = '';
        document.getElementById('char-notes').value = '';
        document.getElementById('char-attributes').innerHTML = '';
        document.getElementById('char-abilities').innerHTML = '';
    }

    saveCharacter(e) {
        e.preventDefault();
        if (!this.state.selectedCharacter) return;

        const characterId = this.state.selectedCharacter;
        const name = document.getElementById('char-name').value;
        const description = document.getElementById('char-description').value;
        const notes = document.getElementById('char-notes').value;

        // 收集属性
        const attributes = { current: {} };
        document.querySelectorAll('#char-attributes .attribute-entry').forEach(entry => {
            const attrName = entry.querySelector('.attr-name').value.trim();
            const attrValue = entry.querySelector('.attr-value').value.trim();
            if (attrName && attrValue) {
                attributes.current[attrName] = attrValue;
            }
        });

        // 收集能力
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
        this.showToast(i18n.t('messages.characterSaved'), 'success');
        this.renderCharacters();
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

    renderAttributes(attributes) {
        const container = document.getElementById('char-attributes');
        container.innerHTML = '';
        if (!attributes) return;

        Object.entries(attributes.current || {}).forEach(([key, value]) => {
            const entry = document.createElement('div');
            entry.className = 'attribute-entry';
            entry.innerHTML = `
                <input type="text" class="input-field attr-name" value="${key}" placeholder="${i18n.t('placeholders.attributeName')}">
                <input type="text" class="input-field attr-value value-input" value="${value}" placeholder="${i18n.t('placeholders.attributeValue')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
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

    renderAbilities(abilities) {
        const container = document.getElementById('char-abilities');
        container.innerHTML = '';
        if (!abilities) return;

        abilities.forEach(ability => {
            const entry = document.createElement('div');
            entry.className = 'ability-entry';
            entry.innerHTML = `
                <div class="ability-header">
                    <input type="text" class="input-field ability-name" value="${ability.name}" placeholder="${i18n.t('placeholders.abilityName')}">
                    <input type="number" class="input-field ability-level" placeholder="${i18n.t('placeholders.abilityLevel')}" min="1" value="${ability.level}">
                    <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
                </div>
                <input type="text" class="input-field ability-desc" value="${ability.description || ''}" placeholder="${i18n.t('placeholders.abilityDesc')}">
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    // Item management
    addItem() {
        if (!this.state.currentStory) {
            this.showToast(i18n.t('messages.createOrLoadStory'), 'error');
            return;
        }
        const item = this.state.addItem({ name: i18n.t('messages.noItems') });
        this.state.selectItem(item.id);
        this.renderItems();
        this.renderItemEditor(item.id);
    }

    renderItems() {
        const container = document.getElementById('items');
        const story = this.state.currentStory;
        if (!story) return;

        container.innerHTML = story.items.map(item => `
            <div class="list-item ${this.state.selectedItem === item.id ? 'active' : ''}"
                 data-item-id="${item.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${item.name}</span>
                    <span class="tag">${Constants.ITEM_TYPES[item.type] || item.type}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-item" data-item-id="${item.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const itemId = item.dataset.itemId;
                    this.state.selectItem(itemId);
                    this.renderItems();
                    this.renderItemEditor(itemId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.itemId;
                if (confirm(i18n.t('messages.confirmDeleteItem'))) {
                    this.state.deleteItem(itemId);
                    this.renderItems();
                    if (this.state.selectedItem === itemId) {
                        this.state.selectItem(null);
                        this.renderItemEditor(null);
                    }
                }
            });
        });

        if (story.items.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">${i18n.t('messages.noItems')}</div></div>`;
        }
    }

    renderItemEditor(itemId) {
        const contentPanel = document.getElementById('item-editor-content');
        const placeholderPanel = document.getElementById('item-editor-placeholder');
        const story = this.state.currentStory;

        if (!itemId || !story) {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearItemForm();
            return;
        }

        const item = story.items.find(i => i.id === itemId);
        if (item) {
            contentPanel.classList.remove('hidden');
            placeholderPanel.classList.remove('active');

            document.getElementById('item-name').value = item.name;
            document.getElementById('item-type').value = item.type;
            document.getElementById('item-description').value = item.description || '';
            this.renderItemProperties(item.properties);
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearItemForm();
        }
    }

    clearItemForm() {
        document.getElementById('item-name').value = '';
        document.getElementById('item-type').value = 'other';
        document.getElementById('item-description').value = '';
        document.getElementById('item-properties').innerHTML = '';
    }

    saveItem(e) {
        e.preventDefault();
        if (!this.state.selectedItem) return;

        const itemId = this.state.selectedItem;
        const name = document.getElementById('item-name').value;
        const type = document.getElementById('item-type').value;
        const description = document.getElementById('item-description').value;

        this.state.updateItem(itemId, { name, type, description });
        this.showToast(i18n.t('messages.itemSaved'), 'success');
        this.renderItems();
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

    renderItemProperties(properties) {
        const container = document.getElementById('item-properties');
        container.innerHTML = '';
        if (!properties) return;

        Object.entries(properties.current || {}).forEach(([key, value]) => {
            const entry = document.createElement('div');
            entry.className = 'property-entry';
            entry.innerHTML = `
                <input type="text" class="input-field prop-name" value="${key}" placeholder="${i18n.t('placeholders.propertyName')}">
                <input type="text" class="input-field prop-value value-input" value="${value}" placeholder="${i18n.t('placeholders.propertyValue')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    // Setting management
    addSetting() {
        if (!this.state.currentStory) {
            this.showToast(i18n.t('messages.createOrLoadStory'), 'error');
            return;
        }
        const setting = this.state.addSetting({ name: i18n.t('messages.noSettings') });
        this.state.selectSetting(setting.id);
        this.renderSettings();
    }

    renderSettings() {
        const container = document.getElementById('settings');
        const story = this.state.currentStory;
        if (!story) return;

        // Update parent dropdown
        const parentSelect = document.getElementById('setting-parent');
        parentSelect.innerHTML = '<option value="">无父级</option>' +
            story.settings.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        container.innerHTML = story.settings.map(setting => `
            <div class="list-item ${this.state.selectedSetting === setting.id ? 'active' : ''}"
                 data-setting-id="${setting.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${setting.name}</span>
                    <span class="tag">${Constants.SETTING_TYPES[setting.type] || setting.type}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-setting" data-setting-id="${setting.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const settingId = item.dataset.settingId;
                    this.state.selectSetting(settingId);
                    this.renderSettings();
                    this.renderSettingEditor(settingId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const settingId = btn.dataset.settingId;
                if (confirm(i18n.t('messages.confirmDeleteSetting'))) {
                    this.state.deleteSetting(settingId);
                    this.renderSettings();
                    if (this.state.selectedSetting === settingId) {
                        this.state.selectSetting(null);
                        this.renderSettingEditor(null);
                    }
                }
            });
        });

        if (story.settings.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏰</div><div class="empty-state-text">${i18n.t('messages.noSettings')}</div></div>`;
    }
    }

    renderSettingEditor(settingId) {
        const contentPanel = document.getElementById('setting-editor-content');
        const placeholderPanel = document.getElementById('setting-editor-placeholder');
        const story = this.state.currentStory;

        if (!settingId || !story) {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearSettingForm();
            return;
        }

        const setting = story.settings.find(s => s.id === settingId);
        if (setting) {
            contentPanel.classList.remove('hidden');
            placeholderPanel.classList.remove('active');

            document.getElementById('setting-name').value = setting.name;
            document.getElementById('setting-type').value = setting.type;
            document.getElementById('setting-parent').value = setting.parentId || '';
            document.getElementById('setting-description').value = setting.description || '';
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearSettingForm();
        }
    }

    clearSettingForm() {
        document.getElementById('setting-name').value = '';
        document.getElementById('setting-type').value = 'location';
        document.getElementById('setting-parent').value = '';
        document.getElementById('setting-description').value = '';
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
        this.showToast(i18n.t('messages.settingSaved'), 'success');
        this.renderSettings();
    }

    // Prompt generation
    renderPromptOptions() {
        const story = this.state.currentStory;
        if (!story) return;

        const chapterSelect = document.getElementById('prompt-chapter');
        chapterSelect.innerHTML = story.chapters
            .sort((a, b) => a.order - b.order)
            .map(ch => `<option value="${ch.id}">${ch.order}. ${ch.title}</option>`)
            .join('');
    }

    generatePrompt() {
        const story = this.state.currentStory;
        if (!story) {
            this.showToast(i18n.t('messages.noStoryLoaded'), 'error');
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
            this.showToast(i18n.t('buttons.copyPrompt'), 'success');
        } catch (err) {
            prompt.select();
            document.execCommand('copy');
            this.showToast(i18n.t('buttons.copyPrompt'), 'success');
        }
    }

    // Theme management
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

        // Try to load from localStorage
        if (this.state.loadFromLocalStorage()) {
            this.showToast(i18n.t('status.saved'), 'success');
        }

        // Restore current view from localStorage
        this.loadViewFromStorage();

        this.updateUndoRedoButtons();
    }

    loadViewFromStorage() {
        const savedView = localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW);
        if (savedView) {
            this.switchView(savedView);
        }
    }

    saveViewToStorage() {
        localStorage.setItem(Constants.STORAGE_KEYS.CURRENT_VIEW, this.currentView);
    }

    // Undo/Redo handlers
    handleUndo() {
        if (this.state.undo()) {
            this.showToast(i18n.t('buttons.undo'), 'success');
            this.refreshCurrentView();
        }
    }

    handleRedo() {
        if (this.state.redo()) {
            this.showToast(i18n.t('buttons.redo'), 'success');
            this.refreshCurrentView();
        }
    }

    onStateRestored() {
        console.log('onStateRestored - currentStory:', this.state.currentStory);

        // Update story title
        const story = this.state.currentStory;
        if (story) {
            document.getElementById('story-title').textContent = story.metadata.title;

            console.log('onStateRestored - selectedChapter:', this.state.selectedChapter, 'chapters:', story.chapters.map(c => ({id: c.id, title: c.title})));

            // Validate selected items exist in current story
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

        this.refreshCurrentView();
        this.updateUndoRedoButtons();
        this.updateSaveStatus();
    }

    refreshCurrentView() {
        switch (this.currentView) {
            case 'story':
                this.renderChapters();
                this.renderChapterEditor(this.state.selectedChapter);
                break;
            case 'character':
                this.renderCharacters();
                this.renderCharacterEditor(this.state.selectedCharacter);
                break;
            case 'item':
                this.renderItems();
                this.renderItemEditor(this.state.selectedItem);
                break;
            case 'setting':
                this.renderSettings();
                this.renderSettingEditor(this.state.selectedSetting);
                break;
        }
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

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
