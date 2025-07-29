#!/usr/bin/env bun
import * as core from '@actions/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UsageStatisticsManager } from './index';
import type { TrackingConfig } from './types';

async function run() {
  try {
    // Get inputs
    const npmPackages = core.getInput('npm-packages');
    const githubRepositories = core.getInput('github-repositories');
    const pypiPackages = core.getInput('pypi-packages');
    const homebrewFormulas = core.getInput('homebrew-formulas');
    const powershellModules = core.getInput('powershell-modules');
    const postmanCollections = core.getInput('postman-collections');
    const goModules = core.getInput('go-modules');
    
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

    // Build configuration from inputs
    const trackingConfig: TrackingConfig = {
      enableLogging: true,
      updateInterval: 60 * 60 * 1000, // 1 hour
      npmPackages: npmPackages ? npmPackages.split(',').map(p => p.trim()).filter(p => p) : [],
      githubRepos: githubRepositories ? githubRepositories.split(',').map(r => r.trim()).filter(r => r) : [],
      pythonPackages: pypiPackages ? pypiPackages.split(',').map(p => p.trim()).filter(p => p) : [],
      homebrewPackages: homebrewFormulas ? homebrewFormulas.split(',').map(f => f.trim()).filter(f => f) : [],
      powershellModules: powershellModules ? powershellModules.split(',').map(m => m.trim()).filter(m => m) : [],
      postmanCollections: postmanCollections ? postmanCollections.split(',').map(c => c.trim()).filter(c => c) : [],
      goModules: goModules ? goModules.split(',').map(m => m.trim()).filter(m => m) : []
    };

    // Validate that at least one platform has packages configured
    const totalPackages = (trackingConfig.npmPackages?.length || 0) + 
                         (trackingConfig.githubRepos?.length || 0) + 
                         (trackingConfig.pythonPackages?.length || 0) + 
                         (trackingConfig.homebrewPackages?.length || 0) + 
                         (trackingConfig.powershellModules?.length || 0) + 
                         (trackingConfig.postmanCollections?.length || 0) + 
                         (trackingConfig.goModules?.length || 0);

    if (totalPackages === 0 && !previewMode) {
      core.warning('No packages configured for tracking. Consider adding packages to track or enabling preview mode.');
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
  let content = '# Usage Statistics Summary\n\n';
  content += `Generated on: ${new Date().toISOString()}\n\n`;

  // Overall Summary
  content += '## Overall Summary\n\n';
  content += `- **Total Downloads**: ${report.totalDownloads.toLocaleString()}\n`;
  content += `- **Unique Packages**: ${report.uniquePackages}\n`;
  content += `- **Platforms Tracked**: ${report.platforms.join(', ')}\n\n`;

  // Platform Totals
  content += '## Platform Totals\n\n';
  for (const [platform, data] of Object.entries(report.platformBreakdown)) {
    content += `### ${platform.toUpperCase()}\n`;
    content += `- **Downloads**: ${data.totalDownloads.toLocaleString()}\n`;
    content += `- **Packages**: ${data.uniquePackages}\n\n`;
  }

  // Package Rankings
  content += '## Package Rankings\n\n';
  report.topPackages.forEach((pkg: any, index: number) => {
    content += `${index + 1}. **${pkg.name}** (${pkg.platform}) - ${pkg.downloads.toLocaleString()} downloads\n`;
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

### Platform Totals
${Object.entries(report.platformBreakdown).map(([platform, data]: [string, any]) => 
  `- **${platform.toUpperCase()}**: ${data.totalDownloads.toLocaleString()} downloads (${data.uniquePackages} packages)`
).join('\n')}

### Top Packages
${report.topPackages.map((pkg: any, index: number) => 
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