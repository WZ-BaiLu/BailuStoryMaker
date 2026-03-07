/**
 * Tests for ModalFormSubmitter
 * 
 * Tests:
 * 1. submitForm - successful submission
 * 2. submitForm - failed submission
 * 3. submitForm - with callbacks
 * 4. validateForm - validation rules
 */

// Import the class to test
import { ModalFormSubmitter } from '../../js/utils/ModalFormSubmitter.js';

describe('ModalFormSubmitter', () => {
  let mockForm;
  let mockNotificationManager;

  beforeEach(() => {
    // Mock form element
    mockForm = {
      elements: {
        name: { value: 'Test Name' },
        email: { value: 'test@example.com' }
      }
    };
    
    // Mock FormData
    global.FormData = jest.fn(() => ({
      entries: () => [
        ['name', 'Test Name'],
        ['email', 'test@example.com']
      ],
      get: (key) => {
        const data = { name: 'Test Name', email: 'test@example.com' };
        return data[key];
      }
    }));
    
    mockNotificationManager = {
      showSuccess: jest.fn(),
      showError: jest.fn()
    };
    
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitForm', () => {
    it('should submit form successfully and return success result', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 123 } })
      });

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager,
        successMessage: 'Success!',
        errorMessage: 'Error!'
      };

      const result = await ModalFormSubmitter.submitForm(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, data: { id: 123 } });
      expect(mockNotificationManager.showSuccess).toHaveBeenCalledWith('Success!');
      expect(mockNotificationManager.showError).not.toHaveBeenCalled();
    });

    it('should call onSuccess callback on success', async () => {
      const onSuccess = jest.fn();
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 123 } })
      });

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager,
        onSuccess
      };

      await ModalFormSubmitter.submitForm(config);

      expect(onSuccess).toHaveBeenCalledWith({ success: true, data: { id: 123 } });
    });

    it('should handle HTTP error responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager,
        errorMessage: 'Submit failed'
      };

      const result = await ModalFormSubmitter.submitForm(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 404: Not Found');
      expect(mockNotificationManager.showError).toHaveBeenCalledWith(
        'Submit failed: HTTP 404: Not Found'
      );
    });

    it('should handle API returning success: false', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Validation failed' })
      });

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager,
        errorMessage: 'Submit failed'
      };

      const result = await ModalFormSubmitter.submitForm(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(mockNotificationManager.showError).toHaveBeenCalledWith(
        'Submit failed: Validation failed'
      );
    });

    it('should call onError callback on failure', async () => {
      const onError = jest.fn();
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager,
        onError
      };

      await ModalFormSubmitter.submitForm(config);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager,
        errorMessage: 'Submit failed'
      };

      const result = await ModalFormSubmitter.submitForm(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockNotificationManager.showError).toHaveBeenCalledWith(
        'Submit failed: Network error'
      );
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      global.fetch.mockRejectedValue(new Error('Network error'));

      const config = {
        form: mockForm,
        url: 'https://api.example.com/submit',
        notificationManager: mockNotificationManager
      };

      await ModalFormSubmitter.submitForm(config);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ModalFormSubmitter] Submit error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('validateForm', () => {
    it('should pass validation when all required fields have values', () => {
      const rules = {
        name: { required: true, label: 'Name' },
        email: { required: true, label: 'Email' }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should fail validation when required field is empty', () => {
      global.FormData = jest.fn(() => ({
        entries: () => [
          ['name', ''],
          ['email', 'test@example.com']
        ],
        get: (key) => {
          const data = { name: '', email: 'test@example.com' };
          return data[key];
        }
      }));

      const rules = {
        name: { required: true, label: 'Name' },
        email: { required: true, label: 'Email' }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
    });

    it('should fail validation when field is too short', () => {
      global.FormData = jest.fn(() => ({
        entries: () => [['password', '123']],
        get: (key) => (key === 'password' ? '123' : null)
      }));

      const rules = {
        password: { minLength: 6, label: 'Password' }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(false);
      expect(result.errors.password).toBe('Password must be at least 6 characters');
    });

    it('should fail validation when field is too long', () => {
      global.FormData = jest.fn(() => ({
        entries: () => [['name', 'This is a very long name']],
        get: (key) => (key === 'name' ? 'This is a very long name' : null)
      }));

      const rules = {
        name: { maxLength: 10, label: 'Name' }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name must be at most 10 characters');
    });

    it('should fail validation when field does not match pattern', () => {
      global.FormData = jest.fn(() => ({
        entries: () => [['email', 'invalid-email']],
        get: (key) => (key === 'email' ? 'invalid-email' : null)
      }));

      const rules = {
        email: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          label: 'Email'
        }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe('Email has invalid format');
    });

    it('should pass validation with valid pattern', () => {
      global.FormData = jest.fn(() => ({
        entries: () => [['email', 'test@example.com']],
        get: (key) => (key === 'email' ? 'test@example.com' : null)
      }));

      const rules = {
        email: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          label: 'Email'
        }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate multiple fields', () => {
      global.FormData = jest.fn(() => ({
        entries: () => [
          ['name', ''],
          ['email', 'invalid'],
          ['age', '15']
        ],
        get: (key) => {
          const data = { name: '', email: 'invalid', age: '15' };
          return data[key];
        }
      }));

      const rules = {
        name: { required: true, label: 'Name' },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'Email' },
        age: { minLength: 18, label: 'Age' }
      };

      const result = ModalFormSubmitter.validateForm(mockForm, rules);

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.email).toBe('Email has invalid format');
      expect(result.errors.age).toBe('Age must be at least 18 characters');
    });

    it('should pass validation when rules are empty', () => {
      const result = ModalFormSubmitter.validateForm(mockForm, {});

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});
