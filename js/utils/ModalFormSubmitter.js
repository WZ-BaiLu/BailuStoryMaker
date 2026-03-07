/**
 * Modal Form Submitter Utilities
 * 
 * Reduces code duplication in modal form submission handlers
 */

class ModalFormSubmitter {
  /**
   * Generic form submit handler
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Result
   */
  static async submitForm(config) {
    const {
      form,
      url,
      notificationManager,
      onSuccess,
      onError,
      successMessage = 'Operation successful',
      errorMessage = 'Operation failed'
    } = config;

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        if (notificationManager) {
          notificationManager.showSuccess(successMessage);
        }
        if (onSuccess) {
          await onSuccess(result);
        }
      } else {
        throw new Error(result.error || 'Operation failed');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('[ModalFormSubmitter] Submit error:', error);
      
      if (notificationManager) {
        notificationManager.showError(`${errorMessage}: ${error.message}`);
      }
      
      if (onError) {
        onError(error);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Validate form data
   * @param {HTMLFormElement} form - Form element
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  static validateForm(form, rules = {}) {
    const formData = new FormData(form);
    const errors = {};

    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = formData.get(fieldName);

      if (rule.required && !value) {
        errors[fieldName] = `${rule.label || fieldName} is required`;
        continue;
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[fieldName] = `${rule.label || fieldName} must be at least ${rule.minLength} characters`;
        continue;
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[fieldName] = `${rule.label || fieldName} must be at most ${rule.maxLength} characters`;
        continue;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[fieldName] = `${rule.label || fieldName} has invalid format`;
        continue;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalFormSubmitter };
}

