/**
 * PyPI Package Download Tracker
 * Uses PyPI JSON API to fetch download statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';

export interface PyPiDownloadStats extends BaseDownloadStats {
  platform: 'pypi';
  packageName: string;
  version: string;
  fileType: string;
  pythonVersion?: string;
  uploadTime: Date;
}

export interface PyPiPackageInfo {
  info: {
    name: string;
    version: string;
    summary?: string;
    description?: string;
    home_page?: string;
    author?: string;
    author_email?: string;
    license?: string;
    requires_python?: string;
    project_urls?: Record<string, string>;
  };
  releases: Record<string, Array<{
    filename: string;
    url: string;
    size: number;
    upload_time: string;
    file_type: string;
    python_version?: string;
    download_count?: number;
  }>>;
  urls: Array<{
    filename: string;
    url: string;
    size: number;
    upload_time: string;
    file_type: string;
    python_version?: string;
    download_count?: number;
  }>;
}

export class PyPiTracker implements PlatformTracker {
  name = 'pypi';
  private baseUrl = 'https://pypi.org/pypi';

  async getDownloadStats(packageName: string, options?: {
    version?: string;
    fileType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PyPiDownloadStats[]> {
    try {
      const packageInfo = await this.getPackageInfo(packageName);
      const stats: PyPiDownloadStats[] = [];

      // Process releases
      for (const [version, files] of Object.entries(packageInfo.releases)) {
        if (options?.version && version !== options.version) {
          continue;
        }

        for (const file of files) {
          if (options?.fileType && file.file_type !== options.fileType) {
            continue;
          }

          // Filter by date range if specified
          const uploadTime = new Date(file.upload_time);
          if (options?.startDate && uploadTime < options.startDate) {
            continue;
          }
          if (options?.endDate && uploadTime > options.endDate) {
            continue;
          }

          stats.push({
            platform: 'pypi',
            packageName,
            version,
            fileType: file.file_type,
            pythonVersion: file.python_version,
            uploadTime,
            downloadCount: file.download_count || 0,
            metadata: {
              filename: file.filename,
              fileSize: file.size,
              url: file.url
            }
          });
        }
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching PyPI stats for ${packageName}:`, error);
      return [];
    }
  }

  async getLatestVersion(packageName: string): Promise<string | null> {
    try {
      const packageInfo = await this.getPackageInfo(packageName);
      return packageInfo.info.version || null;
    } catch (error) {
      console.error(`Error fetching latest version for ${packageName}:`, error);
      return null;
    }
  }

  async getPackageInfo(packageName: string): Promise<PyPiPackageInfo> {
    const response = await fetch(`${this.baseUrl}/${packageName}/json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch package info for ${packageName}`);
    }
    return response.json();
  }

  async getDownloadCounts(packageName: string, period: 'day' | 'week' | 'month' = 'month'): Promise<{
    date: string;
    downloads: number;
  }[]> {
    try {
      // PyPI provides download stats via a separate endpoint
      const response = await fetch(`https://pypi.org/pypi/${packageName}/stats/${period}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch download stats for ${packageName}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Error fetching download counts for ${packageName}:`, error);
      return [];
    }
  }
}

export default PyPiTracker; 