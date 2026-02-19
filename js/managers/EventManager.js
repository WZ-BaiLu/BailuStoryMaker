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

            // Alt + 1-5: Switch views
            if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                const views = ['story', 'character', 'item', 'setting', 'prompt'];
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
     * Bind story view events
     */
    bindStoryViewEvents() {
        document.getElementById('add-chapter-btn').addEventListener('click', () => this.app.addChapter());
        const newParagraphInput = document.getElementById('new-paragraph-input');
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
        this.state.on('paragraphUpdated', () => this.app.uiRenderer.renderParagraphs());
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
