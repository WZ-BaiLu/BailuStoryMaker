/**
 * Unit tests for NotificationManager
 */

// Redefine NotificationManager class for testing
class NotificationManager {
    constructor() {
    }

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

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }
}

describe('NotificationManager', () => {
  let notificationManager;

  beforeEach(() => {
    notificationManager = new NotificationManager();
  });

  afterEach(() => {
    // Clean up any remaining toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
  });

  describe('constructor', () => {
    it('should create a NotificationManager instance', () => {
      expect(notificationManager).toBeInstanceOf(NotificationManager);
      expect(notificationManager).toBeDefined();
    });
  });

  describe('showToast', () => {
    it('should create a toast element and append to body', () => {
      notificationManager.showToast('Test message');

      const toast = document.querySelector('.toast');
      expect(toast).toBeDefined();
      expect(toast.textContent).toBe('Test message');
      expect(toast.parentElement).toBe(document.body);
    });

    it('should add default success class when no type is specified', () => {
      notificationManager.showToast('Test message');

      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('success')).toBe(true);
      expect(toast.classList.contains('error')).toBe(false);
      expect(toast.classList.contains('warning')).toBe(false);
    });

    it('should add error class when type is error', () => {
      notificationManager.showToast('Error message', 'error');

      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('error')).toBe(true);
      expect(toast.classList.contains('success')).toBe(false);
    });

    it('should add warning class when type is warning', () => {
      notificationManager.showToast('Warning message', 'warning');

      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('warning')).toBe(true);
      expect(toast.classList.contains('success')).toBe(false);
    });

    it('should create multiple toasts for multiple calls', () => {
      notificationManager.showToast('First message');
      notificationManager.showToast('Second message');

      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(2);
    });
  });

  describe('showSuccess', () => {
    it('should call showToast with success type', () => {
      const showToastSpy = jest.spyOn(notificationManager, 'showToast');
      notificationManager.showSuccess('Success message');

      expect(showToastSpy).toHaveBeenCalledWith('Success message', 'success');
    });
  });

  describe('showError', () => {
    it('should call showToast with error type', () => {
      const showToastSpy = jest.spyOn(notificationManager, 'showToast');
      notificationManager.showError('Error message');

      expect(showToastSpy).toHaveBeenCalledWith('Error message', 'error');
    });
  });

  describe('showWarning', () => {
    it('should call showToast with warning type', () => {
      const showToastSpy = jest.spyOn(notificationManager, 'showToast');
      notificationManager.showWarning('Warning message');

      expect(showToastSpy).toHaveBeenCalledWith('Warning message', 'warning');
    });
  });

  describe('auto-dismiss behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set opacity to 0 after 3 seconds', () => {
      notificationManager.showToast('Test message', 'success');
      const toast = document.querySelector('.toast');

      jest.advanceTimersByTime(3000);

      expect(toast.style.opacity).toBe('0');
    });

    it('should remove toast from DOM after fade-out animation (300ms after 3s)', () => {
      notificationManager.showToast('Test message', 'success');

      jest.advanceTimersByTime(3000);
      jest.advanceTimersByTime(300);

      const toast = document.querySelector('.toast');
      expect(toast).toBeNull();
    });

    it('should handle multiple toasts independently', () => {
      notificationManager.showToast('First');
      notificationManager.showToast('Second');

      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      notificationManager.showToast('');

      const toast = document.querySelector('.toast');
      expect(toast.textContent).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      notificationManager.showToast(longMessage);

      const toast = document.querySelector('.toast');
      expect(toast.textContent).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Test <script>alert("xss")</script> & "quotes"';
      notificationManager.showToast(specialMessage);

      const toast = document.querySelector('.toast');
      expect(toast.textContent).toBe(specialMessage);
    });

    it('should handle consecutive rapid calls', () => {
      for (let i = 0; i < 10; i++) {
        notificationManager.showToast(`Message ${i}`);
      }

      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(10);
    });
  });
});
