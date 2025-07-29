/**
 * Download Statistics Aggregator
 * Combines and analyzes statistics from all platform trackers
 */

import type { BaseDownloadStats, DownloadStatsAggregator, TrackingConfig } from './types';
import NpmTracker from './trackers/npm';
import GitHubTracker from './trackers/github';
import PyPiTracker from './trackers/pypi';
import HomebrewTracker from './trackers/homebrew';
import PowerShellTracker from './trackers/powershell';
import PostmanTracker from './trackers/postman';
import GoTracker from './trackers/go';
import { globalRateLimiter } from './utils/rate-limiter';

export interface AggregatedStats {
  totalDownloads: number;
  uniquePackages: number;
  platforms: string[];
  platformBreakdown: Record<string, {
    totalDownloads: number;
    uniquePackages: number;
    packages: string[];
  }>;
  topPackages: Array<{
    name: string;
    platform: string;
    downloads: number;
  }>;
}

export class DownloadStatsAggregator implements DownloadStatsAggregator {
  private trackers: Map<string, any> = new Map();
  private config: TrackingConfig;

  constructor(config: TrackingConfig) {
    this.config = config;
    this.initializeTrackers();
  }

  private initializeTrackers() {
    // Initialize all trackers
    this.trackers.set('npm', new NpmTracker());
    this.trackers.set('github', new GitHubTracker(process.env.GITHUB_TOKEN));
    this.trackers.set('pypi', new PyPiTracker());
    this.trackers.set('homebrew', new HomebrewTracker(process.env.GITHUB_TOKEN));
    this.trackers.set('powershell', new PowerShellTracker());
    this.trackers.set('postman', new PostmanTracker(process.env.POSTMAN_API_KEY));
    this.trackers.set('go', new GoTracker(process.env.GITHUB_TOKEN));
  }

  async aggregateStats(stats: BaseDownloadStats[]): Promise<AggregatedStats> {
    const platformBreakdown: Record<string, {
      totalDownloads: number;
      uniquePackages: number;
      packages: string[];
    }> = {};

    const packageMap = new Map<string, { downloads: number; platform: string }>();

    let totalDownloads = 0;
    let uniquePackages = 0;
    const platforms = new Set<string>();

    // Process each stat
    for (const stat of stats) {
      totalDownloads += stat.downloadCount;
      platforms.add(stat.platform);

      // Track package downloads
      const packageKey = `${stat.platform}:${stat.packageName}`;
      const existing = packageMap.get(packageKey);
      if (existing) {
        existing.downloads += stat.downloadCount;
      } else {
        packageMap.set(packageKey, { downloads: stat.downloadCount, platform: stat.platform });
        uniquePackages++;
      }

      // Update platform breakdown
      if (!platformBreakdown[stat.platform]) {
        platformBreakdown[stat.platform] = {
          totalDownloads: 0,
          uniquePackages: 0,
          packages: []
        };
      }
      platformBreakdown[stat.platform].totalDownloads += stat.downloadCount;
      if (!platformBreakdown[stat.platform].packages.includes(stat.packageName)) {
        platformBreakdown[stat.platform].packages.push(stat.packageName);
        platformBreakdown[stat.platform].uniquePackages++;
      }
    }

    // Get top packages
    const topPackages = Array.from(packageMap.entries())
      .map(([key, data]) => ({
        name: key.split(':')[1],
        platform: data.platform,
        downloads: data.downloads
      }))
      .sort((a, b) => b.downloads - a.downloads);

    return {
      totalDownloads,
      uniquePackages,
      platforms: Array.from(platforms),
      platformBreakdown,
      topPackages
    };
  }

  async collectAllStats(): Promise<BaseDownloadStats[]> {
    const allStats: BaseDownloadStats[] = [];

    // Collect NPM stats with rate limiting
    if (this.config.npmPackages) {
      const npmOperations = this.config.npmPackages.map(packageName => 
        async () => {
          try {
            const npmTracker = this.trackers.get('npm');
            const stats = await npmTracker.getDownloadStats(packageName);
            return stats;
          } catch (error) {
            console.error(`Error collecting NPM stats for ${packageName}:`, error);
            return [];
          }
        }
      );
      
      const npmResults = await globalRateLimiter.throttleRequests(npmOperations, 2, 2000);
      npmResults.forEach(stats => allStats.push(...stats));
    }

    // Collect GitHub stats with rate limiting
    if (this.config.githubRepos) {
      const githubOperations = this.config.githubRepos.map(repo => 
        async () => {
          try {
            const githubTracker = this.trackers.get('github');
            const stats = await githubTracker.getDownloadStats(repo);
            return stats;
          } catch (error) {
            console.error(`Error collecting GitHub stats for ${repo}:`, error);
            return [];
          }
        }
      );
      
      const githubResults = await globalRateLimiter.throttleRequests(githubOperations, 1, 3000);
      githubResults.forEach(stats => allStats.push(...stats));
    }

    // Collect PyPI stats with rate limiting
    if (this.config.pythonPackages) {
      const pypiOperations = this.config.pythonPackages.map(packageName => 
        async () => {
          try {
            const pypiTracker = this.trackers.get('pypi');
            const stats = await pypiTracker.getDownloadStats(packageName);
            return stats;
          } catch (error) {
            console.error(`Error collecting PyPI stats for ${packageName}:`, error);
            return [];
          }
        }
      );
      
      const pypiResults = await globalRateLimiter.throttleRequests(pypiOperations, 2, 1500);
      pypiResults.forEach(stats => allStats.push(...stats));
    }

    // Collect Homebrew stats with rate limiting
    if (this.config.homebrewPackages) {
      const homebrewOperations = this.config.homebrewPackages.map(packageName => 
        async () => {
          try {
            const homebrewTracker = this.trackers.get('homebrew');
            const stats = await homebrewTracker.getDownloadStats(packageName);
            return stats;
          } catch (error) {
            console.error(`Error collecting Homebrew stats for ${packageName}:`, error);
            return [];
          }
        }
      );
      
      const homebrewResults = await globalRateLimiter.throttleRequests(homebrewOperations, 2, 2000);
      homebrewResults.forEach(stats => allStats.push(...stats));
    }

    // Collect PowerShell stats with rate limiting
    if (this.config.powershellModules) {
      const powershellOperations = this.config.powershellModules.map(moduleName => 
        async () => {
          try {
            const powershellTracker = this.trackers.get('powershell');
            const stats = await powershellTracker.getDownloadStats(moduleName);
            return stats;
          } catch (error) {
            console.error(`Error collecting PowerShell stats for ${moduleName}:`, error);
            return [];
          }
        }
      );
      
      const powershellResults = await globalRateLimiter.throttleRequests(powershellOperations, 2, 2000);
      powershellResults.forEach(stats => allStats.push(...stats));
    }

    // Collect Postman stats with rate limiting
    if (this.config.postmanCollections) {
      const postmanOperations = this.config.postmanCollections.map(collectionId => 
        async () => {
          try {
            const postmanTracker = this.trackers.get('postman');
            const stats = await postmanTracker.getDownloadStats(collectionId);
            return stats;
          } catch (error) {
            console.error(`Error collecting Postman stats for ${collectionId}:`, error);
            return [];
          }
        }
      );
      
      const postmanResults = await globalRateLimiter.throttleRequests(postmanOperations, 2, 2000);
      postmanResults.forEach(stats => allStats.push(...stats));
    }

    // Collect Go stats with rate limiting
    if (this.config.goModules) {
      const goOperations = this.config.goModules.map(moduleName => 
        async () => {
          try {
            const goTracker = this.trackers.get('go');
            const stats = await goTracker.getDownloadStats(moduleName);
            return stats;
          } catch (error) {
            console.error(`Error collecting Go stats for ${moduleName}:`, error);
            return [];
          }
        }
      );
      
      const goResults = await globalRateLimiter.throttleRequests(goOperations, 2, 2000);
      goResults.forEach(stats => allStats.push(...stats));
    }

    return allStats;
  }

  async generateReport(): Promise<AggregatedStats> {
    const allStats = await this.collectAllStats();
    return this.aggregateStats(allStats);
  }

  async getPlatformStats(platform: string): Promise<BaseDownloadStats[]> {
    const tracker = this.trackers.get(platform);
    if (!tracker) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const allStats: BaseDownloadStats[] = [];
    const packages = this.getPackagesForPlatform(platform);

    const operations = packages.map(packageName => 
      async () => {
        try {
          const stats = await tracker.getDownloadStats(packageName);
          return stats;
        } catch (error) {
          console.error(`Error collecting ${platform} stats for ${packageName}:`, error);
          return [];
        }
      }
    );

    const results = await globalRateLimiter.throttleRequests(operations, 2, 2000);
    results.forEach(stats => allStats.push(...stats));

    return allStats;
  }

  private getPackagesForPlatform(platform: string): string[] {
    switch (platform) {
      case 'npm':
        return this.config.npmPackages || [];
      case 'github':
        return this.config.githubRepos || [];
      case 'pypi':
        return this.config.pythonPackages || [];
      case 'homebrew':
        return this.config.homebrewPackages || [];
      case 'powershell':
        return this.config.powershellModules || [];
      case 'postman':
        return this.config.postmanCollections || [];
      case 'go':
        return this.config.goModules || [];
      default:
        return [];
    }
  }
}

export default DownloadStatsAggregator; 