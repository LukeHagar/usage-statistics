/**
 * Homebrew Package Download Tracker
 * Uses Homebrew API and GitHub API to fetch download statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';

export interface HomebrewDownloadStats extends BaseDownloadStats {
  platform: 'homebrew';
  formulaName: string;
  tapName: string;
  version: string;
  installCount: number;
  analyticsData?: {
    installEvents: number;
    buildErrors: number;
    osVersion: string;
    rubyVersion: string;
  };
}

export interface HomebrewFormulaInfo {
  name: string;
  full_name: string;
  desc?: string;
  homepage?: string;
  version: string;
  installed: number[];
  dependencies: string[];
  conflicts: string[];
  caveats?: string;
  analytics?: {
    install: {
      '30d': Record<string, number>;
      '90d': Record<string, number>;
      '365d': Record<string, number>;
    };
  };
}

export interface HomebrewTapInfo {
  name: string;
  full_name: string;
  description?: string;
  homepage?: string;
  url: string;
  clone_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
}

export class HomebrewTracker implements PlatformTracker {
  name = 'homebrew';
  private baseUrl = 'https://formulae.brew.sh/api';
  private githubToken?: string;

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
  }

  async getDownloadStats(formulaName: string, options?: {
    tapName?: string;
    period?: '30d' | '90d' | '365d';
    startDate?: Date;
    endDate?: Date;
  }): Promise<HomebrewDownloadStats[]> {
    try {
      const formulaInfo = await this.getPackageInfo(formulaName);
      const stats: HomebrewDownloadStats[] = [];

      // Get analytics data if available
      if (formulaInfo.analytics?.install) {
        const period = options?.period || '30d';
        const analytics = formulaInfo.analytics.install[period];
        
        if (analytics) {
          const totalInstalls = Object.values(analytics).reduce((sum, count) => sum + count, 0);
          
          stats.push({
            platform: 'homebrew',
            packageName: formulaName,
            formulaName,
            tapName: this.getTapName(formulaName),
            version: formulaInfo.version,
            installCount: totalInstalls,
            downloadCount: totalInstalls, // For compatibility with BaseDownloadStats
            metadata: {
              analyticsPeriod: period,
              analyticsData: analytics,
              dependencies: formulaInfo.dependencies,
              conflicts: formulaInfo.conflicts
            }
          });
        }
      }

      // If no analytics available, create a basic stat entry
      if (stats.length === 0) {
        stats.push({
          platform: 'homebrew',
          packageName: formulaName,
          formulaName,
          tapName: this.getTapName(formulaName),
          version: formulaInfo.version,
          installCount: formulaInfo.installed.length,
          downloadCount: formulaInfo.installed.length,
          metadata: {
            installedVersions: formulaInfo.installed,
            dependencies: formulaInfo.dependencies,
            conflicts: formulaInfo.conflicts
          }
        });
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching Homebrew stats for ${formulaName}:`, error);
      return [];
    }
  }

  async getLatestVersion(formulaName: string): Promise<string | null> {
    try {
      const formulaInfo = await this.getPackageInfo(formulaName);
      return formulaInfo.version || null;
    } catch (error) {
      console.error(`Error fetching latest version for ${formulaName}:`, error);
      return null;
    }
  }

  async getPackageInfo(formulaName: string): Promise<HomebrewFormulaInfo> {
    const response = await fetch(`${this.baseUrl}/formula/${formulaName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch formula info for ${formulaName}`);
    }
    return response.json();
  }

  async getTapInfo(tapName: string): Promise<HomebrewTapInfo> {
    // Homebrew taps are GitHub repositories
    const response = await fetch(`https://api.github.com/repos/Homebrew/${tapName}`, {
      headers: this.githubToken ? {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      } : {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tap info for ${tapName}`);
    }
    
    return response.json();
  }

  async getAllFormulae(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/formula.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch all formulae');
      }
      
      const formulae = await response.json();
      return formulae.map((formula: any) => formula.name);
    } catch (error) {
      console.error('Error fetching all formulae:', error);
      return [];
    }
  }

  async getAnalytics(formulaName: string, period: '30d' | '90d' | '365d' = '30d'): Promise<{
    date: string;
    installs: number;
  }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/install/${period}/${formulaName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics for ${formulaName}`);
      }
      
      const data = await response.json();
      return data.analytics || [];
    } catch (error) {
      console.error(`Error fetching analytics for ${formulaName}:`, error);
      return [];
    }
  }

  private getTapName(formulaName: string): string {
    // Most formulae are in the homebrew/core tap
    // This is a simplified implementation
    return 'homebrew/core';
  }
}

export default HomebrewTracker; 