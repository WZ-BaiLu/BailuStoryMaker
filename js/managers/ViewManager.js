/**
 * ViewManager
 * Manages view switching and navigation
 */
class ViewManager {
    /**
     * Create a ViewManager instance
     * @param {App} app - The main app instance
     * @param {Object} state - The app state manager
     */
    constructor(app, state) {
        this.app = app;
        this.state = state;
        this.currentView = 'story';
    }

    /**
     * Switch to a specific view
     * @param {'story'|'character'|'item'|'setting'|'prompt'} viewName - The view to switch to
     */
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
                this.app.uiRenderer.renderChapters();
                break;
            case 'character':
                this.app.uiRenderer.renderCharacters();
                break;
            case 'item':
                this.app.uiRenderer.renderItems();
                break;
            case 'setting':
                this.app.uiRenderer.renderSettings();
                break;
            case 'prompt':
                this.app.uiRenderer.renderPromptOptions();
                break;
        }
    }

    /**
     * Refresh the current view
     */
    refreshCurrentView() {
        switch (this.currentView) {
            case 'story':
                this.app.uiRenderer.renderChapters();
                this.app.uiRenderer.renderChapterEditor(this.state.selectedChapter);
                break;
            case 'character':
                this.app.uiRenderer.renderCharacters();
                this.app.uiRenderer.renderCharacterEditor(this.state.selectedCharacter);
                break;
            case 'item':
                this.app.uiRenderer.renderItems();
                this.app.uiRenderer.renderItemEditor(this.state.selectedItem);
                break;
            case 'setting':
                this.app.uiRenderer.renderSettings();
                this.app.uiRenderer.renderSettingEditor(this.state.selectedSetting);
                break;
        }
    }

    /**
     * Load view from localStorage
     */
    loadViewFromStorage() {
        const savedView = localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW);
        if (savedView) {
            this.switchView(savedView);
        }
    }

    /**
     * Save current view to localStorage
     */
    saveViewToStorage() {
        localStorage.setItem(Constants.STORAGE_KEYS.CURRENT_VIEW, this.currentView);
    }

    /**
     * Get the current view name
     * @returns {string} The current view name
     */
    getCurrentView() {
        return this.currentView;
    }
}
