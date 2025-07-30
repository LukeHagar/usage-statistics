/**
 * Shared types for usage statistics tracking across all platforms
 */

export interface BaseDownloadStats {
  platform: string;
  packageName: string;
  version?: string;
  downloadCount: number;
  metadata?: Record<string, any>;
}

export interface PlatformTracker {
  name: string;
  getDownloadStats(packageName: string, options?: any): Promise<BaseDownloadStats[]>;
  getLatestVersion(packageName: string): Promise<string | null>;
  getPackageInfo(packageName: string): Promise<any>;
}

export interface TrackingConfig {
  npmPackages?: string[];
  goModules?: string[];
  pythonPackages?: string[];
  powershellModules?: string[];
  homebrewPackages?: string[];
  githubRepos?: string[];
  postmanCollections?: string[];
  updateInterval?: number; // in milliseconds
  enableLogging?: boolean;
} 