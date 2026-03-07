/**
 * Tests for UIErrorHandler
 * 
 * Tests:
 * 1. safeExecute - async error handling
 * 2. safeExecuteSync - sync error handling
 * 3. showError - notification handling
 */

// Import the class to test
import { UIErrorHandler } from '../../js/utils/UIErrorHandler.js';

describe('UIErrorHandler', () => {
  describe('safeExecute', () => {
    it('should return success result when function succeeds', async () => {
      const fn = async () => 'success';
      const result = await UIErrorHandler.safeExecute(fn);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should catch and handle async errors', async () => {
      const fn = async () => {
        throw new Error('Async error');
      };
      const result = await UIErrorHandler.safeExecute(fn, { operation: 'TestOperation' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Async error');
      expect(result.context.operation).toBe('TestOperation');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const fn = async () => {
        throw new Error('Test error');
      };
      
      await UIErrorHandler.safeExecute(fn, { operation: 'Test' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UIError] Test:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('safeExecuteSync', () => {
    it('should return success result when sync function succeeds', () => {
      const fn = () => 'sync success';
      const result = UIErrorHandler.safeExecuteSync(fn);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('sync success');
    });

    it('should catch and handle sync errors', () => {
      const fn = () => {
        throw new Error('Sync error');
      };
      const result = UIErrorHandler.safeExecuteSync(fn, { operation: 'TestSync' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync error');
      expect(result.context.operation).toBe('TestSync');
    });

    it('should log sync errors to console', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const fn = () => {
        throw new Error('Test sync error');
      };
      
      UIErrorHandler.safeExecuteSync(fn, { operation: 'Test' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UIError] Test:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('showError', () => {
    it('should call notificationManager.showError when provided', () => {
      const notificationManager = {
        showError: jest.fn()
      };
      
      UIErrorHandler.showError('Test error', notificationManager);
      
      expect(notificationManager.showError).toHaveBeenCalledWith('Test error');
    });

    it('should log to console when no notificationManager', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      UIErrorHandler.showError('Test error', null);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[UIError] Test error');
      
      consoleErrorSpy.mockRestore();
    });

    it('should log to console when notificationManager is undefined', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      UIErrorHandler.showError('Test error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[UIError] Test error');
      
      consoleErrorSpy.mockRestore();
    });
  });
});
