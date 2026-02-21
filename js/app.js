/**
 * Main Application Entry Point
 * 
 * The App class serves as the central coordinator for the BailuStory application.
 * It initializes and manages all subsystems through dedicated manager classes.
 */
class App {
    /**
     * Create a new App instance
     */
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

        // Initialize AI components
        this.aiConfigManager = new AIConfigManager();
        this.aiService = new AIService();
        this.aiManager = new AIManager(
            this,
            this.state,
            this.aiConfigManager,
            this.aiService,
            this.notificationManager
        );

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        await this.initI18n();
        this.bindEvents();
        this.loadTheme();
        this.setupKeyboardShortcuts();
        this.aiManager.initialize();
        this.showWelcomeMessage();
    }

    /**
     * Initialize internationalization
     */
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

    /**
     * Initialize language selector dropdown
     */
    initLanguageSelector() {
        const langSelector = document.getElementById('lang-selector');
        if (langSelector) {
            langSelector.value = i18n.getCurrentLanguage();
            langSelector.addEventListener('change', async (e) => {
                await i18n.setLanguage(e.target.value);
            });
        }
    }

    /**
     * Setup keyboard shortcuts via EventManager
     */
    setupKeyboardShortcuts() {
        this.eventManager.setupKeyboardShortcuts();
    }

    /**
     * Bind all UI events via EventManager
     */
    bindEvents() {
        this.eventManager.bindEvents();

        // Bind element tab switching
        this.bindElementTabs();
    }

    /**
     * Bind element tab switching
     */
    bindElementTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;

                // Update button states
                tabButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update content visibility
                document.querySelectorAll('.elements-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const activeContent = document.getElementById(`${tabName}-tab`);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });
    }

    // Story management (delegated to managers)
    
    /**
     * Handle story export
     */
    handleExport() {
        this.exportImportManager.handleExport();
    }

    /**
     * Handle story import
     */
    handleImport() {
        this.exportImportManager.handleImport();
    }

    /**
     * Show new story modal
     */
    showNewStoryModal() {
        this.modalManager.showNewStoryModal();
    }

    /**
     * Hide current modal
     */
    hideModal() {
        this.modalManager.hideModal();
    }

    /**
     * Handle modal form submission
     * @param {Event} e - Submit event
     */
    handleModalSubmit(e) {
        this.modalManager.handleModalSubmit(e);
    }

    /**
     * Called when a story is loaded
     */
    onStoryLoaded() {
        const story = this.state.currentStory;

        // Reload Element/Event/State components with migrated data FIRST
        if (this.aiManager) {
            this.aiManager.reloadElementStateComponents();
        }

        document.getElementById('story-title').textContent = story.metadata.title;
        this.uiRenderer.renderChapters();
        this.uiRenderer.renderAllElements();
        this.uiRenderer.renderCharacters();
        this.uiRenderer.renderItems();
        this.uiRenderer.renderSettings();

        // Restore selected items in editors
        if (this.state.selectedChapter) {
            this.uiRenderer.renderChapterEditor(this.state.selectedChapter);
            this.aiManager.setCurrentChapter(this.state.selectedChapter);
        }
        if (this.state.selectedElement) {
            this.uiRenderer.renderElementEditor(this.state.selectedElement);
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

        // Refresh AI panel
        this.aiManager.refresh();
    }

    /**
     * Update the story title in the header
     */
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
    
    /**
     * Add a new chapter
     */
    addChapter() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const chapter = this.state.addChapter(i18n.t('messages.noChapters'));
        this.state.selectChapter(chapter.id);
        this.uiRenderer.renderChapters();
            this.uiRenderer.renderChapterEditor(chapter.id);
            this.aiManager.setCurrentChapter(chapter.id);
            this.viewManager.handleAIPanelVisibility('story');
    }

    // Paragraph management
    
    /**
     * Handle adding a new paragraph
     */
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
    
    /**
     * Add a new character
     */
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

    /**
     * Save character form data
     * @param {Event} e - Form submit event
     */
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

    /**
     * Add an attribute entry to the character form
     */
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

    /**
     * Add an ability entry to the character form
     */
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
    
    /**
     * Add a new item
     */
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

    /**
     * Save item form data
     * @param {Event} e - Form submit event
     */
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

    /**
     * Add a property entry to the item form
     */
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
    
    /**
     * Add a new setting
     */
    addSetting() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const setting = this.state.addSetting({ name: i18n.t('messages.noSettings') });
        this.state.selectSetting(setting.id);
        this.uiRenderer.renderSettings();
    }

    /**
     * Add a new element
     */
    addElement() {
        if (!this.state.currentStory) {
            this.notificationManager.showError(i18n.t('messages.createOrLoadStory'));
            return;
        }
        const element = this.state.addElement({ type: 'character', name: i18n.t('messages.noCharacters') });
        this.state.selectElement(element.id);
        this.uiRenderer.renderAllElements();
        this.uiRenderer.renderElementEditor(element.id);
    }

    /**
     * Save element form data
     * @param {Event} e - Form submit event
     */
    saveElement(e) {
        e.preventDefault();
        if (!this.state.selectedElement) return;

        const story = this.state.currentStory;
        const element = story.elements.find(el => el.id === this.state.selectedElement);
        if (element) {
            element.type = document.getElementById('element-type').value;
            element.name = document.getElementById('element-name').value.trim();
            element.description = document.getElementById('element-description').value.trim();
            element.keywords = document.getElementById('element-keywords').value
                .split(',')
                .map(k => k.trim())
                .filter(k => k);

            this.state.notify('elementUpdated', element);
            this.uiRenderer.renderAllElements();
            this.notificationManager.showSuccess(i18n.t('status.saved'));
        }
    }

    /**
     * Save setting form data
     * @param {Event} e - Form submit event
     */
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

    /**
     * Generate AI prompt from story context
     */
    async generatePrompt() {
        const story = this.state.currentStory;
        if (!story) {
            this.notificationManager.showError(i18n.t('messages.noStoryLoaded'));
            return;
        }

        const chapterId = document.getElementById('prompt-chapter').value;
        const templateName = document.getElementById('prompt-template').value;

        // Use StateContextCache if available
        const stateContextCache = this.aiManager?.stateContextCache || null;
        const contextBuilder = new ContextBuilder(story, stateContextCache);

        // Build context (async if using cache)
        let context;
        if (stateContextCache) {
            context = await contextBuilder.buildContext(chapterId);
        } else {
            context = contextBuilder.buildContext(chapterId);
        }

        const promptGenerator = new PromptGenerator(Constants.PROMPT_TEMPLATES);
        const prompt = promptGenerator.generatePrompt(context, templateName);

        document.getElementById('generated-prompt').value = prompt;
    }

    /**
     * Copy generated prompt to clipboard
     */
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
                this.notificationManager.showError('复制失败');
                return;
            }
            this.notificationManager.showSuccess(i18n.t('buttons.copyPrompt'));
        }
    }

    // Theme management
    
    /**
     * Load theme from storage
     */
    loadTheme() {
        this.themeManager.loadTheme();
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        this.themeManager.toggleTheme();
    }

    // Utility methods
    
    /**
     * Update save status indicator
     */
    updateSaveStatus() {
        const statusEl = document.getElementById('save-status');
        statusEl.textContent = i18n.t('status.unsaved');
        statusEl.style.color = 'var(--warning-color)';
        setTimeout(() => {
            statusEl.textContent = i18n.t('status.saved');
            statusEl.style.color = 'var(--success-color)';
        }, 2000);
    }

    /**
     * Show welcome message and restore previous state
     */
    showWelcomeMessage() {
        document.getElementById('story-title').textContent = i18n.t('brand.name');

        if (this.state.loadFromLocalStorage()) {
            this.notificationManager.showSuccess(i18n.t('status.saved'));
        }

        this.viewManager.loadViewFromStorage();
        this.updateUndoRedoButtons();
    }

    // Undo/Redo handlers
    
    /**
     * Handle undo action
     */
    handleUndo() {
        this.eventManager.handleUndo();
    }

    /**
     * Handle redo action
     */
    handleRedo() {
        this.eventManager.handleRedo();
    }

    /**
     * Called when state is restored via undo/redo
     */
    onStateRestored() {
        const story = this.state.currentStory;
        if (story) {
            document.getElementById('story-title').textContent = story.metadata.title;

            if (this.state.selectedChapter && !story.chapters.find(c => c.id === this.state.selectedChapter)) {
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
        }

        this.viewManager.refreshCurrentView();
        this.aiManager.refresh();
        this.updateUndoRedoButtons();
        this.updateSaveStatus();
    }

    /**
     * Update undo/redo button states
     */
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
    
    /**
     * Search items by type and query
     * @param {string} type - Search type: 'character', 'item', or 'setting'
     * @param {string} query - Search query string
     * @returns {Array} Matching items
     */
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

    /**
     * Preview the AI prompt for paragraph analysis
     * @param {string} paragraphId - The ID of the paragraph to preview
     */
    async previewAnalysisPrompt(paragraphId) {
        const story = this.state.currentStory;
        if (!story) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noStory'));
            return;
        }

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noChapter'));
            return;
        }

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noParagraph'));
            return;
        }

        try {
            // Get AI manager and paragraph analyzer
            if (!this.aiManager.paragraphAnalyzer) {
                throw new Error('Paragraph analyzer not initialized');
            }

            // Build analysis context
            const context = {
                chapterId: this.state.selectedChapter
            };

            const analysisContext = this.aiManager.paragraphAnalyzer.buildAnalysisContext(paragraph, context);

            // Generate prompt messages
            const promptMessages = this.aiManager.paragraphAnalyzer.generateAnalysisPrompt(paragraph, analysisContext);

            // Build API request object
            const config = this.aiManager.configManager.getConfig();
            const messages = [
                { role: 'system', content: promptMessages.system },
                { role: 'assistant', content: promptMessages.assistant },
                { role: 'user', content: promptMessages.user }
            ];

            // Get tools from AIElementTools if available
            const tools = this.aiManager.aiElementTools?.getToolDefinitions() || [];

            const apiRequest = {
                model: config.model,
                temperature: config.temperature,
                max_tokens: config.maxTokens,
                messages: messages,
                tools: tools.length > 0 ? tools : undefined
            };

            // Show preview modal
            this.showPromptPreviewModal(paragraph, apiRequest);

        } catch (error) {
            this.notificationManager.showError(`预览失败: ${error.message}`);
            console.error('[App] Preview analysis prompt error:', error);
        }
    }

    /**
     * Analyze a paragraph using AI to extract elements, events, and state changes
     * @param {string} paragraphId - The ID of the paragraph to analyze
     */
    async analyzeParagraph(paragraphId) {
        const story = this.state.currentStory;
        if (!story) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noStory'));
            return;
        }

        // Find the paragraph
        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noChapter'));
            return;
        }

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noParagraph'));
            return;
        }

        if (!paragraph.content || paragraph.content.trim() === '') {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.emptyContent'));
            return;
        }

        // Show loading notification
        this.notificationManager.showLoading(i18n.t('ai.paragraphAnalysis.loading'));

        try {
            // Build context for analysis
            const context = {
                chapterId: this.state.selectedChapter,
                paragraphIndex: chapter.paragraphs.findIndex(p => p.id === paragraphId),
                viewLocation: chapter.viewLocation || null
            };

            // Analyze the paragraph
            const result = await this.aiManager.analyzeParagraph(paragraph, context);

            if (!result.success) {
                throw new Error(result.error || i18n.t('ai.paragraphAnalysis.error'));
            }

            const analysis = result.data;

            // Show analysis results modal
            this.showAnalysisResultModal(paragraph, analysis);

            this.notificationManager.hideLoading();
            this.notificationManager.showSuccess(i18n.t('ai.paragraphAnalysis.success'));

        } catch (error) {
            this.notificationManager.hideLoading();
            this.notificationManager.showError(`${i18n.t('ai.paragraphAnalysis.error')}: ${error.message}`);
            console.error('[App] Paragraph analysis error:', error);
        }
    }

    /**
     * Show prompt preview modal
     * @param {Object} paragraph - The paragraph object
     * @param {Object} apiRequest - The complete API request object
     */
    showPromptPreviewModal(paragraph, apiRequest) {
        const modal = document.createElement('div');
        modal.className = 'modal prompt-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👁️ AI API 请求预览</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-section">
                        <h4>段落内容</h4>
                        <p class="preview-text">${paragraph.content}</p>
                    </div>
                    <div class="preview-section">
                        <h4>API 请求参数</h4>
                        <pre class="api-request-preview">${this.escapeHtml(JSON.stringify(apiRequest, null, 2))}</pre>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">关闭</button>
                    <button class="btn btn-primary modal-continue">继续分析</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const continueBtn = modal.querySelector('.modal-continue');

        const closeModal = () => {
            modal.remove();
        };

        const continueAnalysis = () => {
            closeModal();
            this.analyzeParagraph(paragraph.id);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        continueBtn.addEventListener('click', continueAnalysis);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Apply paragraph analysis results
     * @param {string} paragraphId - The ID of the paragraph
     * @param {Object} analysis - The analysis result to apply
     */
    async applyParagraphAnalysis(paragraphId, analysis) {
        this.notificationManager.showLoading(i18n.t('ai.paragraphAnalysis.applying'));

        try {
            const result = await this.aiManager.applyParagraphAnalysis(analysis, paragraphId);

            if (!result.success) {
                throw new Error(result.error || i18n.t('ai.paragraphAnalysis.applyError'));
            }

            // Save to localStorage after applying changes
            this.state.saveToLocalStorage();

            // Refresh UI - also refresh element lists since new elements may have been created
            this.uiRenderer.renderParagraphs();
            this.uiRenderer.renderChangesTracker();
            this.uiRenderer.renderAllElements();
            this.uiRenderer.renderCharacters();
            this.uiRenderer.renderItems();
            this.uiRenderer.renderSettings();

            this.notificationManager.hideLoading();
            this.notificationManager.showSuccess(i18n.t('ai.paragraphAnalysis.applied'));

        } catch (error) {
            this.notificationManager.hideLoading();
            this.notificationManager.showError(`${i18n.t('ai.paragraphAnalysis.applyError')}: ${error.message}`);
            console.error('[App] Apply analysis error:', error);
        }
    }

    /**
     * Show analysis result modal
     * @param {Object} paragraph - The paragraph object
     * @param {Object} analysis - The analysis result
     */
    showAnalysisResultModal(paragraph, analysis) {
        const modal = document.createElement('div');
        modal.className = 'modal analysis-result-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${i18n.t('ai.paragraphAnalysis.resultTitle')}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="analysis-preview">
                        <h4>${i18n.t('ai.paragraphAnalysis.originalText')}</h4>
                        <p class="preview-text">${paragraph.content}</p>
                    </div>

                    ${analysis.elements && analysis.elements.length > 0 ? `
                    <div class="analysis-section">
                        <h4>${i18n.t('ai.paragraphAnalysis.elementsFound')} (${analysis.elements.length})</h4>
                        <ul>
                            ${analysis.elements.map(e => `
                                <li>
                                    <strong>${e.type}:</strong> ${e.name}
                                    ${e.isNew ? `<span class="tag tag-new">${i18n.t('ai.paragraphAnalysis.elementNew')}</span>` : `<span class="tag tag-existing">${i18n.t('ai.paragraphAnalysis.elementExisting')}</span>`}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    ${analysis.events && analysis.events.length > 0 ? `
                    <div class="analysis-section">
                        <h4>${i18n.t('ai.paragraphAnalysis.eventsIdentified')} (${analysis.events.length})</h4>
                        <ul>
                            ${analysis.events.map(e => `
                                <li>
                                    <strong>${e.type}:</strong> ${e.description}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    ${analysis.stateChanges && analysis.stateChanges.length > 0 ? `
                    <div class="analysis-section">
                        <h4>${i18n.t('ai.paragraphAnalysis.stateChanges')} (${analysis.stateChanges.length})</h4>
                        <ul>
                            ${analysis.stateChanges.map(s => `
                                <li>
                                    <strong>${s.elementName || s.elementId}:</strong>
                                    ${s.property}: ${s.from} → ${s.to}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    <div class="analysis-summary">
                        <p>
                            <strong>${i18n.t('ai.paragraphAnalysis.summary')}:</strong>
                            ${i18n.t('ai.paragraphAnalysis.elementsFound')} ${analysis.elements?.length || 0},
                            ${i18n.t('ai.paragraphAnalysis.eventsIdentified')} ${analysis.events?.length || 0},
                            ${i18n.t('ai.paragraphAnalysis.stateChanges')} ${analysis.stateChanges?.length || 0}
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">${i18n.t('ai.paragraphAnalysis.cancelButton')}</button>
                    <button class="btn btn-primary btn-apply-analysis">${i18n.t('ai.paragraphAnalysis.applyButton')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const applyBtn = modal.querySelector('.btn-apply-analysis');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        applyBtn.addEventListener('click', () => {
            closeModal();
            this.applyParagraphAnalysis(paragraph.id, analysis);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
