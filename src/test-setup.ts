/**
 * Test setup file for Bun
 * This file is preloaded before running tests
 */

// Global test utilities can be defined here
(globalThis as any).testUtils = {
  createMockUsageData: (userId: string, action: string) => ({
    timestamp: new Date(),
    userId,
    action,
    metadata: { test: true }
  })
};

// Extend global types
declare global {
  var testUtils: {
    createMockUsageData: (userId: string, action: string) => {
      timestamp: Date;
      userId: string;
      action: string;
      metadata: { test: boolean };
    };
  };
}

// Export to make this a module
export {}; 