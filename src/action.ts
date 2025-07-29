#!/usr/bin/env bun
import * as core from '@actions/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UsageStatisticsManager } from './index';
import { getConfig, validateConfig } from './config';

async function run() {
  try {
    // Get inputs
    const configInput = core.getInput('config');
    const jsonOutputPath = core.getInput('json-output-path');
    const csvOutputPath = core.getInput('csv-output-path');
    const reportOutputPath = core.getInput('report-output-path');
    const updateReadme = core.getInput('update-readme') === 'true';
    const readmePath = core.getInput('readme-path');
    const githubToken = core.getInput('github-token');
    const postmanApiKey = core.getInput('postman-api-key');
    const commitMessage = core.getInput('commit-message');
    const previewMode = core.getInput('preview-mode') === 'true';

    // Set environment variables
    if (githubToken) {
      process.env.GITHUB_TOKEN = githubToken;
    }
    if (postmanApiKey) {
      process.env.POSTMAN_API_KEY = postmanApiKey;
    }

    // Get configuration
    let trackingConfig;
    if (configInput === 'development' || configInput === 'production' || configInput === 'test') {
      trackingConfig = getConfig(configInput as 'development' | 'production' | 'test');
    } else {
      // Try to parse as JSON
      try {
        trackingConfig = JSON.parse(configInput);
      } catch (error) {
        core.setFailed(`Invalid config input: ${configInput}. Must be 'development', 'production', 'test', or valid JSON.`);
        return;
      }
    }

    // Validate configuration
    try {
      validateConfig(trackingConfig);
    } catch (error) {
      core.setFailed(`Configuration validation failed: ${error}`);
      return;
    }

    // Create manager
    const manager = new UsageStatisticsManager(trackingConfig);

    // Generate report
    let report;
    if (previewMode) {
      core.info('🎭 Running in preview mode with mock data...');
      report = await manager.generatePreviewReport();
    } else {
      core.info('📊 Generating comprehensive usage statistics report...');
      report = await manager.generateComprehensiveReport();
    }

    // Display report
    await manager.displayReport(report);

    // Write JSON output
    if (jsonOutputPath) {
      const jsonContent = JSON.stringify(report, null, 2);
      await fs.writeFile(jsonOutputPath, jsonContent);
      core.info(`📄 JSON report written to ${jsonOutputPath}`);
      core.setOutput('json-output', jsonOutputPath);
    }

    // Write CSV output
    if (csvOutputPath) {
      const csvReport = await manager.exportReport('csv');
      await fs.writeFile(csvOutputPath, csvReport);
      core.info(`📊 CSV report written to ${csvOutputPath}`);
      core.setOutput('csv-output', csvOutputPath);
    }

    // Write human-readable report
    if (reportOutputPath) {
      const reportContent = await generateHumanReadableReport(report);
      await fs.writeFile(reportOutputPath, reportContent);
      core.info(`📋 Human-readable report written to ${reportOutputPath}`);
      core.setOutput('report-output', reportOutputPath);
    }

    // Update README if requested
    if (updateReadme && readmePath) {
      try {
        await updateReadmeWithStats(report, readmePath);
        core.info(`📝 README updated at ${readmePath}`);
      } catch (error) {
        core.warning(`Failed to update README: ${error}`);
      }
    }

    // Set outputs
    core.setOutput('total-downloads', report.totalDownloads.toString());
    core.setOutput('unique-packages', report.uniquePackages.toString());
    core.setOutput('platforms-tracked', report.platforms.join(','));

    core.info('✅ Usage Statistics Tracker completed successfully!');

  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

async function generateHumanReadableReport(report: any): Promise<string> {
  let content = '# Usage Statistics Report\n\n';
  content += `Generated on: ${new Date().toISOString()}\n\n`;

  // Summary
  content += '## Summary\n\n';
  content += `- **Total Downloads**: ${report.totalDownloads.toLocaleString()}\n`;
  content += `- **Unique Packages**: ${report.uniquePackages}\n`;
  content += `- **Platforms Tracked**: ${report.platforms.join(', ')}\n\n`;

  // Platform Breakdown
  content += '## Platform Breakdown\n\n';
  for (const [platform, data] of Object.entries(report.platformBreakdown)) {
    content += `### ${platform.toUpperCase()}\n`;
    content += `- Downloads: ${data.totalDownloads.toLocaleString()}\n`;
    content += `- Packages: ${data.uniquePackages}\n`;
    content += `- Package List: ${data.packages.join(', ')}\n\n`;
  }

  // Top Packages
  content += '## Top Packages\n\n';
  report.topPackages.slice(0, 10).forEach((pkg: any, index: number) => {
    content += `${index + 1}. **${pkg.name}** (${pkg.platform}) - ${pkg.downloads.toLocaleString()} downloads\n`;
  });
  content += '\n';

  // Recent Activity
  content += '## Recent Activity\n\n';
  report.recentActivity.slice(0, 5).forEach((activity: any) => {
    content += `- **${activity.packageName}** (${activity.platform}) - ${activity.downloads.toLocaleString()} downloads on ${activity.timestamp.toLocaleDateString()}\n`;
  });

  return content;
}

async function updateReadmeWithStats(report: any, readmePath: string) {
  const STATS_MARKER_START = '<!-- USAGE_STATS_START -->';
  const STATS_MARKER_END = '<!-- USAGE_STATS_END -->';

  try {
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    const statsSection = `
## 📊 Usage Statistics

Last updated: ${new Date().toISOString()}

### Summary
- **Total Downloads**: ${report.totalDownloads.toLocaleString()}
- **Unique Packages**: ${report.uniquePackages}
- **Platforms Tracked**: ${report.platforms.join(', ')}

### Top Packages
${report.topPackages.slice(0, 10).map((pkg: any, index: number) => 
  `${index + 1}. **${pkg.name}** (${pkg.platform}) - ${pkg.downloads.toLocaleString()} downloads`
).join('\n')}

### Recent Activity
${report.recentActivity.slice(0, 5).map((activity: any) => 
  `- **${activity.packageName}** (${activity.platform}) - ${activity.downloads.toLocaleString()} downloads on ${activity.timestamp.toLocaleDateString()}`
).join('\n')}
`;

    const startMarker = readmeContent.indexOf(STATS_MARKER_START);
    const endMarker = readmeContent.indexOf(STATS_MARKER_END);
    
    if (startMarker !== -1 && endMarker !== -1) {
      const beforeStats = readmeContent.substring(0, startMarker + STATS_MARKER_START.length);
      const afterStats = readmeContent.substring(endMarker);
      const updatedContent = beforeStats + statsSection + afterStats;
      await fs.writeFile(readmePath, updatedContent);
    } else {
      core.warning(`Stats markers not found in README. Please add ${STATS_MARKER_START} and ${STATS_MARKER_END} markers.`);
    }
  } catch (error) {
    throw new Error(`Failed to update README: ${error}`);
  }
}

// Run the action
if (import.meta.main) {
  run();
} 