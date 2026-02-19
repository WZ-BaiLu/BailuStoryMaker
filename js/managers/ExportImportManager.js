/**
 * ExportImportManager
 * Manages export and import functionality for stories
 */
class ExportImportManager {
    /**
     * Create an ExportImportManager instance
     * @param {App} app - The main app instance
     * @param {Object} state - The app state manager
     */
    constructor(app, state) {
        this.app = app;
        this.state = state;
    }

    /**
     * Handle export operation
     */
    async handleExport() {
        try {
            const story = this.state.saveStory();
            const filename = `${story.metadata.title}.json`;
            const success = await FileManager.saveAsJSON(story, filename);
            if (success) {
                this.app.notificationManager.showSuccess(i18n.t('status.saved'));
            }
        } catch (error) {
            this.app.notificationManager.showError(error.message);
        }
    }

    /**
     * Handle import operation by triggering file selection
     */
    handleImport() {
        document.getElementById('import-input').click();
    }

    /**
     * Handle import file selection and processing
     * @param {Event} e - The file input change event
     */
    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const story = await FileManager.loadFromJSON(file);
            this.state.loadStory(story);
            this.app.notificationManager.showSuccess(i18n.t('status.saved'));
        } catch (error) {
            this.app.notificationManager.showError(error.message);
        }

        e.target.value = '';
    }
}
