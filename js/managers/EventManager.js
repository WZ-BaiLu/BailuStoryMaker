/**
 * EventManager
 * Manages event binding and keyboard shortcuts
 */
class EventManager {
    /**
     * Create an EventManager instance
     * @param {App} app - The main app instance
     * @param {Object} state - The app state manager
     */
    constructor(app, state) {
        this.app = app;
        this.state = state;
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + E: Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.app.exportImportManager.handleExport();
            }

            // Ctrl/Cmd + I: Import
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.app.exportImportManager.handleImport();
            }

            // Ctrl/Cmd + N: New story
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.app.modalManager.showNewStoryModal();
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
                this.app.modalManager.hideModal();
            }

            // Alt + 1-4: Switch views
            if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                const views = ['story', 'elements', 'setting', 'prompt'];
                this.app.viewManager.switchView(views[parseInt(e.key) - 1]);
            }
        });
    }

    /**
     * Handle undo operation
     */
    handleUndo() {
        if (this.state.undo()) {
            this.app.notificationManager.showSuccess(i18n.t('buttons.undo'));
            this.app.viewManager.refreshCurrentView();
        }
    }

    /**
     * Handle redo operation
     */
    handleRedo() {
        if (this.state.redo()) {
            this.app.notificationManager.showSuccess(i18n.t('buttons.redo'));
            this.app.viewManager.refreshCurrentView();
        }
    }

    /**
     * Bind all UI events
     */
    bindEvents() {
        this.bindNavigationEvents();
        this.bindHeaderEvents();
        this.bindImportEvent();
        this.bindNewStoryEvent();
        this.bindModalEvents();
        this.bindAIConfigEvents();
        this.bindStoryViewEvents();
        this.bindCharacterViewEvents();
        this.bindItemViewEvents();
        this.bindSettingViewEvents();
        this.bindPromptViewEvents();
        this.bindStateListeners();
    }

    /**
     * Bind navigation events
     */
    bindNavigationEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const viewName = e.currentTarget.dataset.view;
                this.app.viewManager.switchView(viewName);
            });
        });
    }

    /**
     * Bind header button events
     */
    bindHeaderEvents() {
        document.getElementById('undo-btn').addEventListener('click', () => this.handleUndo());
        document.getElementById('redo-btn').addEventListener('click', () => this.handleRedo());
        document.getElementById('export-btn').addEventListener('click', () => this.app.exportImportManager.handleExport());
        document.getElementById('import-btn').addEventListener('click', () => this.app.exportImportManager.handleImport());
        document.getElementById('theme-toggle').addEventListener('click', () => this.app.themeManager.toggleTheme());
    }

    /**
     * Bind import input event
     */
    bindImportEvent() {
        document.getElementById('import-input').addEventListener('change', (e) => {
            this.app.exportImportManager.handleImportFile(e);
        });
    }

    /**
     * Bind new story button event
     */
    bindNewStoryEvent() {
        document.getElementById('new-story-btn').addEventListener('click', () => {
            this.app.modalManager.showNewStoryModal();
        });
    }

    /**
     * Bind modal events
     */
    bindModalEvents() {
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.app.modalManager.hideModal();
        });
        document.getElementById('modal-form').addEventListener('submit', (e) => {
            this.app.modalManager.handleModalSubmit(e);
        });
    }

    /**
     * Bind AI config modal events
     */
    bindAIConfigEvents() {
        // Close button
        const aiCloseBtn = document.querySelector('.ai-config-close');
        if (aiCloseBtn) {
            aiCloseBtn.addEventListener('click', () => {
                this.app.modalManager.hideAIConfigModal();
            });
        }

        // Cancel button
        const aiCancelBtn = document.querySelector('.ai-config-cancel');
        if (aiCancelBtn) {
            aiCancelBtn.addEventListener('click', () => {
                this.app.modalManager.hideAIConfigModal();
            });
        }

        // Form submit
        const aiConfigForm = document.getElementById('ai-config-form');
        if (aiConfigForm) {
            aiConfigForm.addEventListener('submit', (e) => {
                this.app.modalManager.handleAIConfigSubmit(e);
            });
        }

        // Provider change
        const aiProvider = document.getElementById('ai-provider');
        if (aiProvider) {
            aiProvider.addEventListener('change', (e) => {
                this.app.modalManager.toggleEndpointField(e.target.value);
            });
        }

        // Temperature slider
        const aiTemp = document.getElementById('ai-temperature');
        const aiTempValue = document.getElementById('ai-temp-value');
        if (aiTemp && aiTempValue) {
            aiTemp.addEventListener('input', (e) => {
                aiTempValue.textContent = e.target.value;
            });
        }

        // Toggle password visibility
        const aiToggleKey = document.getElementById('ai-toggle-key');
        if (aiToggleKey) {
            aiToggleKey.addEventListener('click', () => {
                const apiKeyInput = document.getElementById('ai-api-key');
                if (apiKeyInput.type === 'password') {
                    apiKeyInput.type = 'text';
                    aiToggleKey.textContent = '🙈';
                } else {
                    apiKeyInput.type = 'password';
                    aiToggleKey.textContent = '👁️';
                }
            });
        }

        // Test connection
        const aiTestBtn = document.getElementById('ai-test-connection');
        if (aiTestBtn) {
            aiTestBtn.addEventListener('click', () => {
                this.app.modalManager.handleTestConnection();
            });
        }

        // Reset defaults
        const aiResetBtn = document.getElementById('ai-reset-config');
        if (aiResetBtn) {
            aiResetBtn.addEventListener('click', () => {
                this.app.modalManager.handleResetAIConfig();
            });
        }

        // Clear key
        const aiClearKeyBtn = document.getElementById('ai-clear-key');
        if (aiClearKeyBtn) {
            aiClearKeyBtn.addEventListener('click', () => {
                this.app.modalManager.handleClearAIKey();
            });
        }

        // Escape key to close AI config modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const aiModal = document.getElementById('ai-config-modal');
                if (aiModal && !aiModal.classList.contains('hidden')) {
                    this.app.modalManager.hideAIConfigModal();
                }
            }
        });
    }

    /**
     * Bind story view events
     */
    bindStoryViewEvents() {
        document.getElementById('add-chapter-btn').addEventListener('click', () => this.app.addChapter());

        // Show AI panel button
        const showAIPanelBtn = document.getElementById('show-ai-panel-btn');
        if (showAIPanelBtn) {
            showAIPanelBtn.addEventListener('click', () => {
                this.app.viewManager.showAIAssistantPanel();
            });
        }

        const newParagraphInput = document.getElementById('new-paragraph-input');
        newParagraphInput.addEventListener('focus', () => {
            // Clear paragraph selection when focusing on new paragraph input
            this.app.uiRenderer.selectedParagraph = null;
            this.app.uiRenderer.renderParagraphs();
        });
        newParagraphInput.addEventListener('keydown', (e) => {
            // Enter (without Shift or Ctrl) to submit
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                this.app.handleNewParagraph();
            }
            // Ctrl+Enter to also submit
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.app.handleNewParagraph();
            }
        });
    }

    /**
     * Bind character view events
     */
    bindCharacterViewEvents() {
        document.getElementById('add-character-btn').addEventListener('click', () => this.app.addCharacter());
        document.getElementById('character-form').addEventListener('submit', (e) => this.app.saveCharacter(e));
        document.getElementById('add-attr-btn').addEventListener('click', () => this.app.addAttribute());
        document.getElementById('add-ability-btn').addEventListener('click', () => this.app.addAbility());
    }

    /**
     * Bind item view events
     */
    bindItemViewEvents() {
        document.getElementById('add-item-btn').addEventListener('click', () => this.app.addItem());
        document.getElementById('item-form').addEventListener('submit', (e) => this.app.saveItem(e));
        document.getElementById('add-prop-btn').addEventListener('click', () => this.app.addProperty());
    }

    /**
     * Bind setting view events
     */
    bindSettingViewEvents() {
        document.getElementById('add-setting-btn').addEventListener('click', () => this.app.addSetting());
        document.getElementById('setting-form').addEventListener('submit', (e) => this.app.saveSetting(e));
    }

    /**
     * Bind prompt view events
     */
    bindPromptViewEvents() {
        document.getElementById('generate-prompt-btn').addEventListener('click', () => this.app.generatePrompt());
        document.getElementById('copy-prompt-btn').addEventListener('click', () => this.app.copyPrompt());
    }

    /**
     * Bind state change listeners
     */
    bindStateListeners() {
        this.state.on('storyLoaded', () => this.app.onStoryLoaded());
        this.state.on('chapterAdded', () => this.app.uiRenderer.renderChapters());
        this.state.on('chapterUpdated', () => this.app.updateSaveStatus());
        this.state.on('paragraphAdded', () => this.app.uiRenderer.renderParagraphs());
        // Don't auto-render on paragraphUpdated to prevent losing focus during editing
        this.state.on('paragraphDeleted', () => this.app.uiRenderer.renderParagraphs());
        this.state.on('characterAdded', () => this.app.uiRenderer.renderCharacters());
        this.state.on('characterUpdated', () => this.app.updateSaveStatus());
        this.state.on('itemAdded', () => this.app.uiRenderer.renderItems());
        this.state.on('itemUpdated', () => this.app.updateSaveStatus());
        this.state.on('settingAdded', () => this.app.uiRenderer.renderSettings());
        this.state.on('settingUpdated', () => this.app.updateSaveStatus());
        this.state.on('stateRestored', () => this.app.onStateRestored());
        this.state.history.on('historyChanged', () => this.app.updateUndoRedoButtons());
    }
}
