/**
 * NotificationManager
 * Manages Toast notifications for user feedback
 */
class NotificationManager {
    /**
     * Create a NotificationManager instance
     */
    constructor() {
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {'success'|'error'|'warning'} type - The notification type
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto-dismiss after 3 seconds with fade-out animation
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show a success notification
     * @param {string} message - The message to display
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show an error notification
     * @param {string} message - The message to display
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show a warning notification
     * @param {string} message - The message to display
     */
    showWarning(message) {
        this.showToast(message, 'warning');
    }

    /**
     * Show an info notification
     * @param {string} message - The message to display
     */
    showInfo(message) {
        this.showToast(message, 'success');
    }
}
