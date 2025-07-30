/**
 * GitHub Release Download Tracker
 * Uses GitHub API with Octokit to fetch release download statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';
import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';

export interface GitHubDownloadStats extends BaseDownloadStats {
  platform: 'github';
  repository: string;
  releaseId: number;
  releaseName: string;
  releaseTag: string;
  assetName?: string;
  assetId?: number;
}

export interface GitHubReleaseInfo {
  id: number;
  name: string | null;
  tag_name: string;
  published_at: string | null;
  assets: Array<{
    id: number;
    name: string;
    download_count: number;
    size: number;
    content_type: string;
  }>;
  body?: string | null;
  draft: boolean;
  prerelease: boolean;
}

export interface GitHubRepositoryInfo {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language?: string | null;
  created_at: string;
  updated_at: string;
}

export class GitHubTracker implements PlatformTracker {
  name = 'github';
  private token?: string;
  private octokit: Octokit | null = null;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.initializeOctokit();
  }

  private async initializeOctokit() {
    // Create Octokit with retry and throttling plugins
    const MyOctokit = Octokit.plugin(retry, throttling);
    
    this.octokit = new MyOctokit({
      auth: this.token,
      userAgent: 'usage-statistics-tracker',
      timeZone: 'UTC',
      baseUrl: 'https://api.github.com',
      log: {
        debug: () => {},
        info: () => {},
        warn: console.warn,
        error: console.error
      },
      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          console.warn(`Rate limit hit for ${options.request.url}, retrying after ${retryAfter} seconds`);
          return true; // Retry after the specified time
        },
        onSecondaryRateLimit: (retryAfter: number, options: any) => {
          console.warn(`Secondary rate limit hit for ${options.request.url}, retrying after ${retryAfter} seconds`);
          return true; // Retry after the specified time
        }
      },
      retry: {
        doNotRetry: [400, 401, 403, 404, 422], // Don't retry on these status codes
        enabled: true
      }
    });
  }

  async getDownloadStats(repository: string, options?: {
    releaseTag?: string;
    assetName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<GitHubDownloadStats[]> {
    try {
      const [owner, repo] = repository.split('/');
      if (!owner || !repo) {
        throw new Error(`Invalid repository format: ${repository}. Expected format: owner/repo`);
      }

      const releases = await this.getReleases(owner, repo);
      const stats: GitHubDownloadStats[] = [];

      for (const release of releases) {
        // Filter by release tag if specified
        if (options?.releaseTag && release.tag_name !== options.releaseTag) {
          continue;
        }

        for (const asset of release.assets) {
          // Filter by asset name if specified
          if (options?.assetName && asset.name !== options.assetName) {
            continue;
          }

          stats.push({
            platform: 'github',
            packageName: repository,
            repository,
            releaseId: release.id,
            releaseName: release.name || 'Unknown',
            releaseTag: release.tag_name,
            assetName: asset.name,
            assetId: asset.id,
            downloadCount: asset.download_count,
            metadata: {
              assetSize: asset.size,
              contentType: asset.content_type,
              isDraft: release.draft,
              isPrerelease: release.prerelease
            }
          });
        }
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching GitHub stats for ${repository}:`, error);
      return [];
    }
  }

  async getLatestVersion(repository: string): Promise<string | null> {
    try {
      const [owner, repo] = repository.split('/');
      const releases = await this.getReleases(owner, repo);
      
      // Get the latest non-draft, non-prerelease
      const latestRelease = releases.find(r => !r.draft && !r.prerelease);
      return latestRelease?.tag_name || null;
    } catch (error) {
      console.error(`Error fetching latest version for ${repository}:`, error);
      return null;
    }
  }

  async getPackageInfo(repository: string): Promise<GitHubRepositoryInfo> {
    const [owner, repo] = repository.split('/');
    
    if (!this.octokit) {
      throw new Error('Octokit not initialized');
    }
    
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching repository info for ${repository}:`, error);
      throw error;
    }
  }

  private async getReleases(owner: string, repo: string): Promise<GitHubReleaseInfo[]> {
    if (!this.octokit) {
      throw new Error('Octokit not initialized');
    }
    
    try {
      const response = await this.octokit.repos.listReleases({
        owner,
        repo,
        per_page: 100
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching releases for ${owner}/${repo}:`, error);
      throw error;
    }
  }


}

export default GitHubTracker; 