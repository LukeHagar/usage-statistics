/**
 * GitHub Release Download Tracker
 * Uses GitHub API with Octokit to fetch release download statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';
import { Octokit } from '@octokit/rest';

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
    if (typeof window === 'undefined') {
      // Server-side: use Octokit
      this.octokit = new Octokit({
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
        request: {
          timeout: 10000,
          retries: 3,
          retryAfterBaseValue: 1,
          retryAfterMaxValue: 60
        }
      });
    } else {
      // Client-side: use fetch API
      this.octokit = null;
    }
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
    
    if (this.octokit) {
      // Use Octokit if available
      try {
        const response = await this.octokit.repos.get({
          owner,
          repo
        });
        return response.data;
      } catch (error: any) {
        if (error.status === 403 && error.message.includes('abuse detection')) {
          console.warn(`Rate limit hit for ${repository}, waiting 60 seconds...`);
          await this.sleep(60000);
          return this.getPackageInfo(repository); // Retry once
        }
        throw error;
      }
    } else {
      // Fallback to fetch API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: this.token ? {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        } : {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`Rate limit hit for ${repository}, waiting 60 seconds...`);
          await this.sleep(60000);
          return this.getPackageInfo(repository); // Retry once
        }
        throw new Error(`Failed to fetch repository info for ${repository}`);
      }
      
      return response.json();
    }
  }

  private async getReleases(owner: string, repo: string): Promise<GitHubReleaseInfo[]> {
    if (this.octokit) {
      // Use Octokit if available
      try {
        const response = await this.octokit.repos.listReleases({
          owner,
          repo,
          per_page: 100
        });
        return response.data;
      } catch (error: any) {
        if (error.status === 403 && error.message.includes('abuse detection')) {
          console.warn(`Rate limit hit for ${owner}/${repo}, waiting 60 seconds...`);
          await this.sleep(60000);
          return this.getReleases(owner, repo); // Retry once
        }
        throw error;
      }
    } else {
      // Fallback to fetch API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`, {
        headers: this.token ? {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        } : {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`Rate limit hit for ${owner}/${repo}, waiting 60 seconds...`);
          await this.sleep(60000);
          return this.getReleases(owner, repo); // Retry once
        }
        throw new Error(`Failed to fetch releases for ${owner}/${repo}`);
      }
      
      return response.json();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GitHubTracker; 