/**
 * Go Module Download Tracker
 * Uses Go module proxy and GitHub API to fetch download statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';

export interface GoDownloadStats extends BaseDownloadStats {
  platform: 'go';
  moduleName: string;
  version: string;
  goVersion: string;
  downloadCount: number;
  publishedDate: Date;
  goModHash: string;
}

export interface GoModuleInfo {
  Path: string;
  Version: string;
  Time: string;
  Main: boolean;
  GoMod: string;
  GoVersion: string;
  Retracted: boolean;
  RetractedReason?: string;
}

export interface GoModuleVersions {
  Path: string;
  Versions: string[];
  Time: Record<string, string>;
  Origin: Record<string, any>;
}

export interface GoModuleZipInfo {
  Path: string;
  Version: string;
  Mod: GoModuleInfo;
  Zip: {
    Hash: string;
    Size: number;
  };
}

export class GoTracker implements PlatformTracker {
  name = 'go';
  private proxyUrl = 'https://proxy.golang.org';
  private githubToken?: string;

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
  }

  async getDownloadStats(moduleName: string, options?: {
    version?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<GoDownloadStats[]> {
    try {
      const versions = await this.getModuleVersions(moduleName);
      const stats: GoDownloadStats[] = [];

      for (const version of versions.Versions) {
        if (options?.version && version !== options.version) {
          continue;
        }

        const moduleInfo = await this.getModuleInfo(moduleName, version);
        const publishedDate = new Date(moduleInfo.Time);
        
        // Filter by date range if specified
        if (options?.startDate && publishedDate < options.startDate) {
          continue;
        }
        if (options?.endDate && publishedDate > options.endDate) {
          continue;
        }

        // Get download count (Go doesn't provide direct download stats)
        // We'll use GitHub stars/forks as a proxy for popularity
        const downloadCount = await this.getEstimatedDownloads(moduleName, version);

        stats.push({
          platform: 'go',
          packageName: moduleName,
          moduleName,
          version,
          goVersion: moduleInfo.GoVersion,
          downloadCount,
          publishedDate,
          goModHash: moduleInfo.GoMod,
          timestamp: publishedDate,
          period: 'total',
          metadata: {
            isMain: moduleInfo.Main,
            isRetracted: moduleInfo.Retracted,
            retractedReason: moduleInfo.RetractedReason,
            goModHash: moduleInfo.GoMod
          }
        });
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching Go stats for ${moduleName}:`, error);
      return [];
    }
  }

  async getLatestVersion(moduleName: string): Promise<string | null> {
    try {
      const versions = await this.getModuleVersions(moduleName);
      return versions.Versions[versions.Versions.length - 1] || null;
    } catch (error) {
      console.error(`Error fetching latest version for ${moduleName}:`, error);
      return null;
    }
  }

  async getPackageInfo(moduleName: string): Promise<GoModuleInfo> {
    const latestVersion = await this.getLatestVersion(moduleName);
    if (!latestVersion) {
      throw new Error(`No versions found for module ${moduleName}`);
    }
    return this.getModuleInfo(moduleName, latestVersion);
  }

  async getModuleVersions(moduleName: string): Promise<GoModuleVersions> {
    const response = await fetch(`${this.proxyUrl}/${moduleName}/@v/list`);
    if (!response.ok) {
      throw new Error(`Failed to fetch versions for ${moduleName}`);
    }
    
    const versions = await response.text();
    const versionList = versions.trim().split('\n').filter(v => v);
    
    // Get time information for each version
    const timeInfo: Record<string, string> = {};
    for (const version of versionList) {
      const timeResponse = await fetch(`${this.proxyUrl}/${moduleName}/@v/${version}.info`);
      if (timeResponse.ok) {
        const timeData = await timeResponse.json();
        timeInfo[version] = timeData.Time;
      }
    }

    return {
      Path: moduleName,
      Versions: versionList,
      Time: timeInfo,
      Origin: {}
    };
  }

  async getModuleInfo(moduleName: string, version: string): Promise<GoModuleInfo> {
    const response = await fetch(`${this.proxyUrl}/${moduleName}/@v/${version}.info`);
    if (!response.ok) {
      throw new Error(`Failed to fetch module info for ${moduleName}@${version}`);
    }
    return response.json();
  }

  async getModuleZip(moduleName: string, version: string): Promise<GoModuleZipInfo> {
    const response = await fetch(`${this.proxyUrl}/${moduleName}/@v/${version}.zip`);
    if (!response.ok) {
      throw new Error(`Failed to fetch module zip for ${moduleName}@${version}`);
    }
    
    // Get the mod info
    const modInfo = await this.getModuleInfo(moduleName, version);
    
    return {
      Path: moduleName,
      Version: version,
      Mod: modInfo,
      Zip: {
        Hash: '', // Would need to calculate hash from response
        Size: parseInt(response.headers.get('content-length') || '0')
      }
    };
  }

  private async getEstimatedDownloads(moduleName: string, version: string): Promise<number> {
    try {
      // Try to get GitHub repository info if it's a GitHub module
      if (moduleName.includes('github.com')) {
        const repoPath = moduleName.replace('github.com/', '');
        const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
          headers: this.githubToken ? {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          } : {
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (response.ok) {
          const repoData = await response.json();
          // Use stars + forks as a rough estimate of popularity
          return (repoData.stargazers_count || 0) + (repoData.forks_count || 0);
        }
      }
      
      // Fallback: use a simple heuristic based on version age
      const moduleInfo = await this.getModuleInfo(moduleName, version);
      const ageInDays = (Date.now() - new Date(moduleInfo.Time).getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(1, Math.floor(100 / (ageInDays + 1))); // More downloads for newer versions
    } catch (error) {
      console.error(`Error estimating downloads for ${moduleName}@${version}:`, error);
      return 1;
    }
  }

  async searchModules(query: string): Promise<{
    modules: Array<{
      path: string;
      version: string;
      time: string;
    }>;
  }> {
    try {
      // Go doesn't have a built-in search API, but we can search GitHub for Go modules
      const response = await fetch(`https://api.github.com/search/repositories?q=${query}+language:go&sort=stars&order=desc`, {
        headers: this.githubToken ? {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        } : {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search Go modules');
      }
      
      const data = await response.json();
      return {
        modules: data.items.map((repo: any) => ({
          path: `github.com/${repo.full_name}`,
          version: 'latest',
          time: repo.created_at
        }))
      };
    } catch (error) {
      console.error('Error searching Go modules:', error);
      return { modules: [] };
    }
  }

  async getModuleAnalytics(moduleName: string): Promise<{
    totalVersions: number;
    latestVersion: string;
    firstPublished: Date;
    lastPublished: Date;
    estimatedTotalDownloads: number;
  }> {
    try {
      const versions = await this.getModuleVersions(moduleName);
      const latestVersion = versions.Versions[versions.Versions.length - 1];
      
      let firstPublished = new Date();
      let lastPublished = new Date(0);
      let totalDownloads = 0;
      
      for (const version of versions.Versions) {
        const moduleInfo = await this.getModuleInfo(moduleName, version);
        const publishedDate = new Date(moduleInfo.Time);
        
        if (publishedDate < firstPublished) {
          firstPublished = publishedDate;
        }
        if (publishedDate > lastPublished) {
          lastPublished = publishedDate;
        }
        
        totalDownloads += await this.getEstimatedDownloads(moduleName, version);
      }

      return {
        totalVersions: versions.Versions.length,
        latestVersion: latestVersion || '',
        firstPublished,
        lastPublished,
        estimatedTotalDownloads: totalDownloads
      };
    } catch (error) {
      console.error(`Error fetching analytics for ${moduleName}:`, error);
      return {
        totalVersions: 0,
        latestVersion: '',
        firstPublished: new Date(),
        lastPublished: new Date(),
        estimatedTotalDownloads: 0
      };
    }
  }
}

export default GoTracker; 