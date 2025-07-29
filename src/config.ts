/**
 * Configuration for usage statistics tracking
 * Customize this file to track your specific packages and tools
 */

import type { TrackingConfig } from './types';

export const defaultConfig: TrackingConfig = {
  // NPM packages - Add your NPM package names here
  npmPackages: [
    'lodash',
    'axios'
  ],
  
  // GitHub repositories - Format: 'owner/repo'
  githubRepos: [
    'microsoft/vscode',
    'facebook/react'
  ],
  
  // PyPI packages - Add your Python package names here
  pythonPackages: [
    'requests',
    'numpy'
  ],
  
  // Homebrew formulae - Add your Homebrew package names here
  homebrewPackages: [
    'git',
    'node'
  ],
  
  // PowerShell modules - Add your PowerShell module names here
  powershellModules: [
    'PowerShellGet'
  ],
  
  // Postman collections - Add your Postman collection IDs here
  postmanCollections: [
    // Note: These are example IDs - replace with real collection IDs
    // For testing, we'll leave these empty to avoid errors
  ],
  
  // Go modules - Add your Go module paths here
  goModules: [
    'github.com/gin-gonic/gin',
    'github.com/go-chi/chi'
  ],
  
  // Update interval in milliseconds (default: 1 hour)
  updateInterval: 60 * 60 * 1000,
  
  // Enable detailed logging
  enableLogging: true
};

// Test configuration with minimal packages
export const testConfig: TrackingConfig = {
  npmPackages: ['lodash'],
  githubRepos: [],
  pythonPackages: ['requests'],
  homebrewPackages: ['git'],
  powershellModules: [],
  postmanCollections: [],
  goModules: [],
  updateInterval: 60 * 60 * 1000,
  enableLogging: false
};

// Environment-specific configurations
export const developmentConfig: TrackingConfig = {
  ...defaultConfig,
  enableLogging: true,
  updateInterval: 5 * 60 * 1000, // 5 minutes for development
};

export const productionConfig: TrackingConfig = {
  ...defaultConfig,
  enableLogging: false,
  updateInterval: 60 * 60 * 1000, // 1 hour for production
};

// Helper function to get configuration based on environment
export function getConfig(environment: 'development' | 'production' | 'default' | 'test' = 'default'): TrackingConfig {
  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return defaultConfig;
  }
}

// Helper function to validate configuration
export function validateConfig(config: TrackingConfig): string[] {
  const errors: string[] = [];
  
  if (!config.npmPackages && !config.githubRepos && !config.pythonPackages && 
      !config.homebrewPackages && !config.powershellModules && 
      !config.postmanCollections && !config.goModules) {
    errors.push('No packages configured for tracking. Please add packages to at least one platform.');
  }
  
  if (config.updateInterval && config.updateInterval < 60000) {
    errors.push('Update interval should be at least 60 seconds to avoid rate limiting.');
  }
  
  return errors;
} 