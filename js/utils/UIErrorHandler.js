/**
 * Error Handling Utilities
 * 
 * Provides consistent error handling across UI components
 */

class UIErrorHandler {
  /**
   * Safely execute async function with error handling
   * @param {Function} fn - Function to execute
   * @param {Object} context - Error context
   * @returns {Promise<*>} Result or error object
   */
  static async safeExecute(fn, context = {}) {
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      console.error(`[UIError] ${context.operation || 'Unknown operation'}:`, error);
      return { success: false, error: error.message, context };
    }
  }

  /**
   * Safely execute synchronous function with error handling
   * @param {Function} fn - Function to execute
   * @param {Object} context - Error context
   * @returns {Object} Result or error object
   */
  static safeExecuteSync(fn, context = {}) {
    try {
      const result = fn();
      return { success: true, data: result };
    } catch (error) {
      console.error(`[UIError] ${context.operation || 'Unknown operation'}:`, error);
      return { success: false, error: error.message, context };
    }
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {NotificationManager} notificationManager - Notification manager
   */
  static showError(message, notificationManager) {
    if (notificationManager) {
      notificationManager.showError(message);
    } else {
      console.error(`[UIError] ${message}`);
    }
  }
}
