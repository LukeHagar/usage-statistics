/**
 * Core types for the simplified usage statistics system
 */

export interface MetricResult {
  platform: string;
  name: string;
  timestamp: string;
  metrics?: {
    stars?: number;
    forks?: number;
    watchers?: number;
    openIssues?: number;
    totalReleaseDownloads?: number;
    downloadsTotal?: number;
    downloadsRange?: {
      day: string;
      downloads: number;
    }[];
  } & Record<string, any>;
  error?: string;
}

export interface MetricCollector {
  collect(source: string): Promise<MetricResult>;
  collectBatch?(sources: string[]): Promise<MetricResult[]>;
}

export interface CollectorConfig {
  collect: MetricCollector;
  batched?: boolean;
}

export interface SourceConfig {
  platform: string;
  name: string;
  options?: Record<string, any>;
}

export interface CollectionResult {
  results: MetricResult[];
  summary: string;
  timestamp: string;
} 