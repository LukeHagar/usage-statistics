#!/usr/bin/env bun
import type { TrackingConfig } from './types';
import { DownloadStatsAggregator } from './aggregator';
import type { AggregatedStats } from './aggregator';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

/**
 * Usage Statistics Tracker
 * 
 * Tracks download statistics across multiple platforms:
 * - NPM packages
 * - PyPI packages  
 * - Homebrew formulas
 * - PowerShell modules
 * - Postman collections
 * - Go modules
 * - GitHub releases
 */

const STATS_FILE = 'stats.json';
const README_FILE = 'README.md';
const STATS_MARKER_START = '<!-- USAGE_STATS_START -->';
const STATS_MARKER_END = '<!-- USAGE_STATS_END -->';

async function writeStatsFile(stats: AggregatedStats, filePath = STATS_FILE) {
  await fs.writeFile(filePath, JSON.stringify(stats, null, 2));
  console.log(`📄 Stats written to ${filePath}`);
}

async function updateReadmeWithStats(stats: AggregatedStats, readmePath = README_FILE) {
  try {
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    const statsSection = `
## 📊 Usage Statistics

Last updated: ${new Date().toISOString()}

### Summary
- **Total Downloads**: ${stats.totalDownloads.toLocaleString()}
- **Unique Packages**: ${stats.uniquePackages}
- **Platforms Tracked**: ${stats.platforms.join(', ')}

### Top Packages
${stats.topPackages.map((pkg, index) => 
  `${index + 1}. **${pkg.name}** (${pkg.platform}) - ${pkg.downloads.toLocaleString()} downloads`
).join('\n')}
`;

    const startMarker = readmeContent.indexOf(STATS_MARKER_START);
    const endMarker = readmeContent.indexOf(STATS_MARKER_END);
    
    if (startMarker !== -1 && endMarker !== -1) {
      const beforeStats = readmeContent.substring(0, startMarker + STATS_MARKER_START.length);
      const afterStats = readmeContent.substring(endMarker);
      const updatedContent = beforeStats + statsSection + afterStats;
      await fs.writeFile(readmePath, updatedContent);
      console.log(`📝 README updated with stats`);
    } else {
      console.warn(`⚠️  Stats markers not found in README. Please add ${STATS_MARKER_START} and ${STATS_MARKER_END} markers.`);
    }
  } catch (error) {
    console.error('❌ Error updating README:', error);
  }
}

async function gitCommitAndPush(files: string[], message: string) {
  execSync(`git config user.name "github-actions[bot]"`);
  execSync(`git config user.email "github-actions[bot]@users.noreply.github.com"`);
  execSync(`git add ${files.join(' ')}`);
  execSync(`git commit -m "${message}" || echo 'No changes to commit.'`);
  execSync(`git push`);
}

class UsageStatisticsManager {
  private aggregator: DownloadStatsAggregator;
  private lastUpdateTime: Date | null = null;

  constructor(config: TrackingConfig) {
    this.aggregator = new DownloadStatsAggregator(config);
  }

  async generateComprehensiveReport(): Promise<AggregatedStats> {
    console.log('📊 Generating comprehensive usage statistics report...\n');
    const stats = await this.aggregator.collectAllStats();
    const report = this.aggregator.aggregateStats(stats);
    this.lastUpdateTime = new Date();
    return report;
  }

  async getPlatformReport(platform: string): Promise<AggregatedStats> {
    console.log(`📊 Generating ${platform} platform report...\n`);
    const stats = await this.aggregator.getPlatformStats(platform);
    const report = this.aggregator.aggregateStats(stats);
    this.lastUpdateTime = new Date();
    return report;
  }

  async exportReport(format: 'json' | 'csv' = 'json'): Promise<string> {
    const report = await this.generateComprehensiveReport();
    
    if (format === 'csv') {
      const csvHeader = 'Platform,Package,Downloads\n';
      const csvRows = report.topPackages.map(pkg => 
        `${pkg.platform},${pkg.name},${pkg.downloads}`
      ).join('\n');
      return csvHeader + csvRows;
    }
    
    return JSON.stringify(report, null, 2);
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdateTime;
  }

  async displayReport(report: AggregatedStats) {
    console.log('📊 Usage Statistics Summary');
    console.log('==================================================\n');
    
    // Overall Summary
    console.log('📈 Overall Summary:');
    console.log(`Total Downloads: ${report.totalDownloads.toLocaleString()}`);
    console.log(`Unique Packages: ${report.uniquePackages}`);
    console.log(`Platforms Tracked: ${report.platforms.join(', ')}\n`);
    
    // Platform Totals
    console.log('🏗️  Platform Totals:');
    for (const [platform, data] of Object.entries(report.platformBreakdown)) {
      console.log(`  ${platform.toUpperCase()}: ${data.totalDownloads.toLocaleString()} downloads (${data.uniquePackages} packages)`);
    }
    console.log('');
    
    // Package Rankings
    console.log('🏆 Package Rankings:');
    report.topPackages.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.name} (${pkg.platform}) - ${pkg.downloads.toLocaleString()} downloads`);
    });
    console.log('==================================================');
  }

  async generatePreviewReport(): Promise<AggregatedStats> {
    console.log('🎭 Generating preview report with mock data...\n');
    
    // Create mock data for preview
    const mockStats = [
      {
        platform: 'npm',
        packageName: 'lodash',
        downloadCount: 1500000,
        metadata: { version: '4.17.21' }
      },
      {
        platform: 'npm', 
        packageName: 'axios',
        downloadCount: 800000,
        metadata: { version: '1.6.0' }
      },
      {
        platform: 'github',
        packageName: 'microsoft/vscode',
        downloadCount: 500000,
        metadata: { release: 'v1.85.0' }
      },
      {
        platform: 'pypi',
        packageName: 'requests',
        downloadCount: 300000,
        metadata: { version: '2.31.0' }
      },
      {
        platform: 'homebrew',
        packageName: 'git',
        downloadCount: 250000,
        metadata: { version: '2.43.0' }
      },
      {
        platform: 'powershell',
        packageName: 'PowerShellGet',
        downloadCount: 120000,
        metadata: { version: '2.2.5' }
      },
      {
        platform: 'postman',
        packageName: 'Postman Collection',
        downloadCount: 75000,
        metadata: { collectionId: '12345' }
      },
      {
        platform: 'go',
        packageName: 'github.com/gin-gonic/gin',
        downloadCount: 45000,
        metadata: { version: 'v1.9.1' }
      }
    ];

    const report = this.aggregator.aggregateStats(mockStats);
    this.lastUpdateTime = new Date();
    return report;
  }
}

async function main() {
  console.log('🚀 Usage Statistics Tracker Starting...\n');
  
  // Create a default configuration for CLI usage
  const defaultConfig: TrackingConfig = {
    enableLogging: true,
    updateInterval: 60 * 60 * 1000, // 1 hour
    npmPackages: ['lodash', 'axios'],
    githubRepos: ['microsoft/vscode', 'facebook/react'],
    pythonPackages: ['requests', 'numpy'],
    homebrewPackages: ['git', 'node'],
    powershellModules: ['PowerShellGet'],
    postmanCollections: [],
    goModules: ['github.com/gin-gonic/gin', 'github.com/go-chi/chi']
  };

  const manager = new UsageStatisticsManager(defaultConfig);
  
  try {
    // Check for preview mode
    const isPreview = process.argv.includes('--preview') || process.argv.includes('-p');
    
    let report: AggregatedStats;
    if (isPreview) {
      report = await manager.generatePreviewReport();
    } else {
      report = await manager.generateComprehensiveReport();
    }
    
    await manager.displayReport(report);
    
    const jsonReport = await manager.exportReport('json');
    console.log('\n📄 JSON Report:');
    console.log(jsonReport);

    // Only write files and commit if not in preview mode and running in GitHub Actions
    if (!isPreview && (process.env.GITHUB_ACTIONS === 'true' || process.argv.includes('--action'))) {
      await writeStatsFile(report);
      await updateReadmeWithStats(report);
      await gitCommitAndPush([STATS_FILE, README_FILE], 'chore: update usage statistics [skip ci]');
      console.log('✅ Stats written, README updated, and changes pushed.');
    } else if (isPreview) {
      console.log('\n🎭 Preview mode - no files written or commits made');
    }
    
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (import.meta.main) {
  main();
}

export { UsageStatisticsManager }; 