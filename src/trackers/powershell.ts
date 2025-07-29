/**
 * PowerShell Gallery Module Download Tracker
 * Uses PowerShell Gallery API to fetch download statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';

export interface PowerShellDownloadStats extends BaseDownloadStats {
  platform: 'powershell';
  moduleName: string;
  version: string;
  author: string;
  description?: string;
  tags: string[];
  downloadCount: number;
  publishedDate: Date;
}

export interface PowerShellModuleInfo {
  Id: string;
  Version: string;
  Title: string;
  Author: string;
  Description: string;
  Tags: string[];
  PublishedDate: string;
  UpdatedDate: string;
  DownloadCount: number;
  IsLatestVersion: boolean;
  Dependencies: Array<{
    id: string;
    version: string;
  }>;
  PowerShellVersion: string;
  ProjectUri?: string;
  LicenseUri?: string;
  IconUri?: string;
  ReleaseNotes?: string;
}

export interface PowerShellSearchResult {
  TotalCount: number;
  Results: PowerShellModuleInfo[];
}

export class PowerShellTracker implements PlatformTracker {
  name = 'powershell';
  private baseUrl = 'https://www.powershellgallery.com/api/v2';

  async getDownloadStats(moduleName: string, options?: {
    version?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PowerShellDownloadStats[]> {
    try {
      const moduleInfo = await this.getPackageInfo(moduleName);
      const stats: PowerShellDownloadStats[] = [];

      // Get all versions of the module
      const allVersions = await this.getAllVersions(moduleName);
      
      for (const version of allVersions) {
        if (options?.version && version.Version !== options.version) {
          continue;
        }

        const publishedDate = new Date(version.PublishedDate);
        
        // Filter by date range if specified
        if (options?.startDate && publishedDate < options.startDate) {
          continue;
        }
        if (options?.endDate && publishedDate > options.endDate) {
          continue;
        }

        stats.push({
          platform: 'powershell',
          packageName: moduleName,
          moduleName,
          version: version.Version,
          author: version.Author,
          description: version.Description,
          tags: version.Tags,
          downloadCount: version.DownloadCount,
          publishedDate,
          timestamp: publishedDate,
          period: 'total',
          metadata: {
            isLatestVersion: version.IsLatestVersion,
            dependencies: version.Dependencies,
            powershellVersion: version.PowerShellVersion,
            projectUri: version.ProjectUri,
            licenseUri: version.LicenseUri,
            releaseNotes: version.ReleaseNotes
          }
        });
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching PowerShell stats for ${moduleName}:`, error);
      return [];
    }
  }

  async getLatestVersion(moduleName: string): Promise<string | null> {
    try {
      const moduleInfo = await this.getPackageInfo(moduleName);
      return moduleInfo.Version || null;
    } catch (error) {
      console.error(`Error fetching latest version for ${moduleName}:`, error);
      return null;
    }
  }

  async getPackageInfo(moduleName: string): Promise<PowerShellModuleInfo> {
    const response = await fetch(`${this.baseUrl}/package/${moduleName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch module info for ${moduleName}`);
    }
    return response.json();
  }

  async getAllVersions(moduleName: string): Promise<PowerShellModuleInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/package/${moduleName}/versions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch versions for ${moduleName}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Error fetching versions for ${moduleName}:`, error);
      return [];
    }
  }

  async searchModules(query: string, options?: {
    includePrerelease?: boolean;
    skip?: number;
    take?: number;
  }): Promise<PowerShellSearchResult> {
    const params = new URLSearchParams({
      $filter: `IsLatestVersion eq true`,
      $orderby: 'DownloadCount desc',
      $skip: (options?.skip || 0).toString(),
      $top: (options?.take || 50).toString()
    });

    if (query) {
      params.set('$filter', `${params.get('$filter')} and substringof('${query}', Id)`);
    }

    const response = await fetch(`${this.baseUrl}/search?${params}`);
    if (!response.ok) {
      throw new Error('Failed to search modules');
    }
    
    return response.json();
  }

  async getPopularModules(limit: number = 50): Promise<PowerShellModuleInfo[]> {
    try {
      const searchResult = await this.searchModules('', { take: limit });
      return searchResult.Results;
    } catch (error) {
      console.error('Error fetching popular modules:', error);
      return [];
    }
  }

  async getModuleAnalytics(moduleName: string): Promise<{
    totalDownloads: number;
    downloadsByVersion: Record<string, number>;
    downloadsByDate: Array<{
      date: string;
      downloads: number;
    }>;
  }> {
    try {
      const allVersions = await this.getAllVersions(moduleName);
      
      const downloadsByVersion: Record<string, number> = {};
      let totalDownloads = 0;
      
      for (const version of allVersions) {
        downloadsByVersion[version.Version] = version.DownloadCount;
        totalDownloads += version.DownloadCount;
      }

      // Note: PowerShell Gallery doesn't provide detailed time-based analytics
      // This is a simplified implementation
      const downloadsByDate = allVersions.map(version => ({
        date: version.PublishedDate,
        downloads: version.DownloadCount
      }));

      return {
        totalDownloads,
        downloadsByVersion,
        downloadsByDate
      };
    } catch (error) {
      console.error(`Error fetching analytics for ${moduleName}:`, error);
      return {
        totalDownloads: 0,
        downloadsByVersion: {},
        downloadsByDate: []
      };
    }
  }
}

export default PowerShellTracker; 