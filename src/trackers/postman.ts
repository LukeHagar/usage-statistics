/**
 * Postman Collection Download/Fork Tracker
 * Uses Postman API to fetch collection statistics
 */

import type { BaseDownloadStats, PlatformTracker } from '../types';

export interface PostmanDownloadStats extends BaseDownloadStats {
  platform: 'postman';
  collectionId: string;
  collectionName: string;
  version: string;
  forkCount: number;
  downloadCount: number;
  viewCount: number;
  author: string;
  publishedDate: Date;
}

export interface PostmanCollectionInfo {
  id: string;
  name: string;
  description?: string;
  version: string;
  author: {
    id: string;
    name: string;
    username: string;
  };
  publishedAt: string;
  updatedAt: string;
  forkCount: number;
  downloadCount: number;
  viewCount: number;
  schema: string;
  info: {
    name: string;
    description?: string;
    version: string;
    schema: string;
  };
  item: any[];
  variable: any[];
}

export interface PostmanWorkspaceInfo {
  id: string;
  name: string;
  type: 'personal' | 'team' | 'private';
  description?: string;
  collections: PostmanCollectionInfo[];
}

export class PostmanTracker implements PlatformTracker {
  name = 'postman';
  private baseUrl = 'https://api.getpostman.com';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getDownloadStats(collectionId: string, options?: {
    version?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PostmanDownloadStats[]> {
    try {
      const collectionInfo = await this.getPackageInfo(collectionId);
      const stats: PostmanDownloadStats[] = [];

      // Get collection versions if available
      const versions = await this.getCollectionVersions(collectionId);
      
      for (const version of versions) {
        if (options?.version && version.version !== options.version) {
          continue;
        }

        const publishedDate = new Date(version.publishedAt);
        
        // Filter by date range if specified
        if (options?.startDate && publishedDate < options.startDate) {
          continue;
        }
        if (options?.endDate && publishedDate > options.endDate) {
          continue;
        }

        stats.push({
          platform: 'postman',
          packageName: collectionId,
          collectionId,
          collectionName: version.name,
          version: version.version,
          forkCount: version.forkCount || 0,
          downloadCount: version.downloadCount || 0,
          viewCount: version.viewCount || 0,
          author: version.author?.name || 'Unknown',
          publishedDate,
          metadata: {
            authorId: version.author?.id,
            authorUsername: version.author?.username,
            schema: version.schema,
            itemCount: version.item?.length || 0
          }
        });
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching Postman stats for ${collectionId}:`, error);
      return [];
    }
  }

  async getLatestVersion(collectionId: string): Promise<string | null> {
    try {
      const collectionInfo = await this.getPackageInfo(collectionId);
      return collectionInfo.version || null;
    } catch (error) {
      console.error(`Error fetching latest version for ${collectionId}:`, error);
      return null;
    }
  }

  async getPackageInfo(collectionId: string): Promise<PostmanCollectionInfo> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}/collections/${collectionId}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch collection info for ${collectionId}`);
    }
    
    return response.json();
  }

  async getCollectionVersions(collectionId: string): Promise<PostmanCollectionInfo[]> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.baseUrl}/collections/${collectionId}/versions`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch versions for ${collectionId}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error fetching versions for ${collectionId}:`, error);
      return [];
    }
  }

  async searchCollections(query: string, options?: {
    workspaceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    collections: PostmanCollectionInfo[];
    totalCount: number;
  }> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const params = new URLSearchParams({
        q: query,
        limit: (options?.limit || 50).toString(),
        offset: (options?.offset || 0).toString()
      });

      if (options?.workspaceId) {
        params.set('workspace', options.workspaceId);
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to search collections');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error searching collections:', error);
      return {
        collections: [],
        totalCount: 0
      };
    }
  }

  async getWorkspaceCollections(workspaceId: string): Promise<PostmanCollectionInfo[]> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/collections`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workspace collections for ${workspaceId}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error fetching workspace collections for ${workspaceId}:`, error);
      return [];
    }
  }

  async getCollectionAnalytics(collectionId: string): Promise<{
    totalDownloads: number;
    totalForks: number;
    totalViews: number;
    downloadsByVersion: Record<string, number>;
    forksByVersion: Record<string, number>;
  }> {
    try {
      const versions = await this.getCollectionVersions(collectionId);
      
      const downloadsByVersion: Record<string, number> = {};
      const forksByVersion: Record<string, number> = {};
      let totalDownloads = 0;
      let totalForks = 0;
      let totalViews = 0;
      
      for (const version of versions) {
        downloadsByVersion[version.version] = version.downloadCount || 0;
        forksByVersion[version.version] = version.forkCount || 0;
        totalDownloads += version.downloadCount || 0;
        totalForks += version.forkCount || 0;
        totalViews += version.viewCount || 0;
      }

      return {
        totalDownloads,
        totalForks,
        totalViews,
        downloadsByVersion,
        forksByVersion
      };
    } catch (error) {
      console.error(`Error fetching analytics for ${collectionId}:`, error);
      return {
        totalDownloads: 0,
        totalForks: 0,
        totalViews: 0,
        downloadsByVersion: {},
        forksByVersion: {}
      };
    }
  }
}

export default PostmanTracker; 