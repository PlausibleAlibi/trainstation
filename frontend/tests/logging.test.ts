/**
 * Tests for frontend logging utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  value: mockSendBeacon,
  writable: true,
});

// Mock window properties
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true,
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true,
});

// Import the logging module after mocks are set up
describe('Frontend Logging', () => {
  let Logger: any;
  let log: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset module imports
    vi.resetModules();
    
    // Import fresh instance
    const loggingModule = await import('../src/shared/logging');
    Logger = loggingModule.default;
    log = loggingModule.log;
    
    // Mock fetch to return success
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', count: 1 })
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Logging Functions', () => {
    it('should create debug logs', () => {
      log.debug('Debug message', { test: true });
      expect(mockFetch).not.toHaveBeenCalled(); // Should be buffered
    });

    it('should create info logs', () => {
      log.info('Info message', { component: 'TestComponent' });
      expect(mockFetch).not.toHaveBeenCalled(); // Should be buffered
    });

    it('should create warning logs', () => {
      log.warn('Warning message', { warning_type: 'validation' });
      expect(mockFetch).not.toHaveBeenCalled(); // Should be buffered
    });

    it('should create error logs and flush immediately', async () => {
      const testError = new Error('Test error');
      
      log.error('Error message', testError, { component: 'TestComponent' });
      
      // Error logs should trigger immediate flush
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toBe('/api/logging/submit');
      
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.logs).toHaveLength(1);
      expect(requestBody.logs[0].level).toBe('error');
      expect(requestBody.logs[0].message).toBe('Error message');
      expect(requestBody.logs[0].errorStack).toContain('Test error');
    });
  });

  describe('Log Buffering and Flushing', () => {
    it('should buffer logs until flush is called', async () => {
      // Add multiple logs
      log.info('Message 1');
      log.info('Message 2');
      log.info('Message 3');
      
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Manual flush
      await log.flush();
      
      expect(mockFetch).toHaveBeenCalledOnce();
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.logs).toHaveLength(3);
    });

    it('should auto-flush when buffer is full', async () => {
      // Add 10 logs to fill buffer (assuming buffer size is 10)
      for (let i = 1; i <= 10; i++) {
        log.info(`Message ${i}`);
      }
      
      // Should auto-flush
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Log Entry Structure', () => {
    it('should include required fields in log entries', async () => {
      log.info('Test message', { custom: 'context' });
      await log.flush();
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const logEntry = requestBody.logs[0];
      
      expect(logEntry).toMatchObject({
        level: 'info',
        message: 'Test message',
        source: 'frontend',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/test',
        context: expect.objectContaining({
          custom: 'context',
          component: expect.any(String)
        })
      });
      
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should include error details for error logs', async () => {
      const testError = new Error('Test error message');
      testError.name = 'CustomError';
      
      log.error('Error occurred', testError, { operation: 'test' });
      
      // Wait for immediate flush
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const logEntry = requestBody.logs[0];
      
      expect(logEntry.errorStack).toContain('Test error message');
      expect(logEntry.context.errorName).toBe('CustomError');
      expect(logEntry.context.errorMessage).toBe('Test error message');
      expect(logEntry.context.operation).toBe('test');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      log.info('Test message');
      await log.flush();
      
      // Should not throw error
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      log.info('Test message');
      await log.flush();
      
      // Should not throw error
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Page Unload Handling', () => {
    it('should use sendBeacon for synchronous flush', async () => {
      // Import logging again to trigger constructor
      const { default: Logger } = await import('../src/shared/logging');
      
      log.info('Test message before unload');
      
      // Simulate page unload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      // Should use sendBeacon instead of fetch
      expect(mockSendBeacon).toHaveBeenCalled();
    });
  });
});