/**
 * ModalManager
 * Manages modal dialogs and user interactions
 */
class ModalManager {
    /**
     * Create a ModalManager instance
     * @param {App} app - The main app instance
     * @param {Object} state - The app state manager
     */
    constructor(app, state) {
        this.app = app;
        this.state = state;
    }

    /**
     * Show the new story modal
     */
    showNewStoryModal() {
        document.getElementById('modal-title').textContent = i18n.t('modal.newStory');
        document.getElementById('modal-input').placeholder = i18n.t('placeholder.inputName');
        document.getElementById('modal-input').value = '';
        document.getElementById('modal').classList.remove('hidden');
    }

    /**
     * Hide the modal dialog
     */
    hideModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    /**
     * Handle modal form submission
     * @param {Event} e - The form submit event
     */
    handleModalSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('modal-input').value.trim();
        if (!title) return;

        const newStory = this.state.createStory(title);
        this.state.loadStory(newStory);
        this.hideModal();
        this.app.notificationManager.showSuccess(i18n.t('status.saved'));
    }
}
