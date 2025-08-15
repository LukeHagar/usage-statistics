import { mkdirSync, writeFileSync } from "fs";
import { Chart, registerables } from 'chart.js';
import { Canvas } from 'skia-canvas';
import semver from "semver";
// Register all Chart.js controllers
Chart.register(...registerables);
export function formatGitHubSummary(summary, platformMetrics) {
    let totalStars = 0;
    let totalForks = 0;
    let totalWatchers = 0;
    let totalIssues = 0;
    let totalOpenIssues = 0;
    let totalClosedIssues = 0;
    let totalDownloads = 0;
    let totalReleases = 0;
    summary += `| Repository | Stars | Forks | Watchers | Open Issues | Closed Issues | Total Issues | Release Downloads | Releases | Latest Release | Language |\n`;
    summary += `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
    for (const metric of platformMetrics) {
        const stars = metric.metrics?.stars || 0;
        const forks = metric.metrics?.forks || 0;
        const watchers = metric.metrics?.watchers || 0;
        const issues = metric.metrics?.totalIssues || 0;
        const openIssues = metric.metrics?.openIssues || 0;
        const closedIssues = metric.metrics?.closedIssues || 0;
        const downloads = metric.metrics?.totalReleaseDownloads || 0;
        const releases = metric.metrics?.releaseCount || 0;
        const latestRelease = metric.metrics?.latestRelease || 'N/A';
        const language = metric.metrics?.language || 'N/A';
        totalStars += stars;
        totalForks += forks;
        totalWatchers += watchers;
        totalIssues += issues;
        totalOpenIssues += openIssues;
        totalClosedIssues += closedIssues;
        totalDownloads += downloads;
        totalReleases += releases;
        summary += `| ${metric.name} | ${stars.toLocaleString()} | ${forks.toLocaleString()} | ${watchers.toLocaleString()} | ${openIssues.toLocaleString()} | ${closedIssues.toLocaleString()} | ${issues.toLocaleString()} | ${downloads.toLocaleString()} | ${releases.toLocaleString()} | ${latestRelease} | ${language} |\n`;
    }
    summary += `| **Total** | **${totalStars.toLocaleString()}** | **${totalForks.toLocaleString()}** | **${totalWatchers.toLocaleString()}** | **${totalOpenIssues.toLocaleString()}** | **${totalClosedIssues.toLocaleString()}** | **${totalIssues.toLocaleString()}** | **${totalDownloads.toLocaleString()}** | **${totalReleases.toLocaleString()}** | | |\n`;
    return summary;
}
export async function addRepoDetails(summary, metrics) {
    summary += `#### Repository Details:\n\n`;
    for (const metric of metrics) {
        summary += `**${metric.name}**:\n`;
        summary += `- Last Activity: ${metric.metrics?.lastActivity?.toLocaleString() || 0} days ago\n`;
        summary += `- Repository Age: ${metric.metrics?.repositoryAge?.toLocaleString() || 0} days\n`;
        summary += `- Release Count: ${metric.metrics?.releaseCount?.toLocaleString() || 0}\n`;
        summary += `- Total Release Downloads: ${metric.metrics?.totalReleaseDownloads?.toLocaleString() || 0}\n`;
        summary += `- Latest Release: ${metric.metrics?.latestRelease || 'N/A'}\n`;
        summary += `- Latest Release Downloads: ${metric.metrics?.latestReleaseDownloads?.toLocaleString() || 0}\n`;
        summary += `- Views: ${metric.metrics?.viewsCount?.toLocaleString() || 0}\n`;
        summary += `- Unique Visitors: ${metric.metrics?.uniqueVisitors?.toLocaleString() || 0}\n`;
        summary += `- Clones: ${metric.metrics?.clonesCount?.toLocaleString() || 0}\n`;
        summary += `\n`;
    }
    summary += `\n\n`;
    const chatOutputPath = './charts/github';
    mkdirSync(chatOutputPath, { recursive: true });
    const svgOutputPathList = await createGitHubReleaseChart(metrics, chatOutputPath);
    for (const svgOutputPath of svgOutputPathList) {
        summary += `![${svgOutputPath}](${svgOutputPath})\n`;
    }
    return summary;
}
export async function createGitHubReleaseChart(platformMetrics, outputPath) {
    const svgOutputPathList = [];
    for (const metric of platformMetrics) {
        // Only create charts if there's download data
        if (metric.metrics?.downloadRange && metric.metrics.downloadRange.length > 0) {
            const svgOutputPath = await createDownloadsPerReleaseChart(metric, outputPath);
            svgOutputPathList.push(svgOutputPath);
            const svgOutputPathCumulative = await createCumulativeDownloadsChart(metric, outputPath);
            svgOutputPathList.push(svgOutputPathCumulative);
            const svgOutputPathReleases = await createReleaseDownloadsChart(metric, outputPath);
            svgOutputPathList.push(svgOutputPathReleases);
        }
    }
    return svgOutputPathList;
}
function groupByReleaseCumulative(releaseRange) {
    const releases = {};
    for (const release of releaseRange.sort((a, b) => {
        return semver.compare(a.tagName || '0.0.0', b.tagName || '0.0.0');
    })) {
        if (!release.tagName) {
            continue;
        }
        if (!releases[release.tagName]) {
            releases[release.tagName] = { downloads: release.downloads, tagName: release.tagName || '' };
        }
        else {
            releases[release.tagName].downloads += release.downloads;
        }
    }
    let cumulativeDownloads = 0;
    for (const release of Object.keys(releases).sort((a, b) => {
        return semver.compare(a, b);
    })) {
        cumulativeDownloads += releases[release].downloads;
        releases[release].downloads = cumulativeDownloads;
    }
    return releases;
}
export async function createDownloadsPerReleaseChart(metric, outputPath) {
    const downloadsRange = metric.metrics?.downloadRange || [];
    const svgOutputPath = `${outputPath}/${metric.name.replace('/', '-')}-release-downloads.svg`;
    const sortedReleases = downloadsRange.sort((a, b) => {
        return semver.compare(a.tagName || '0.0.0', b.tagName || '0.0.0');
    });
    const canvas = new Canvas(1000, 800);
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sortedReleases.map((release) => release.tagName),
            datasets: [{
                    label: `${metric.name} Release Downloads`,
                    data: sortedReleases.map((release) => release.downloads),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${metric.name} - Release Downloads`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Release'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Downloads'
                    },
                    beginAtZero: true
                }
            }
        }
    });
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' });
    writeFileSync(svgOutputPath, svgBuffer);
    chart.destroy();
    return svgOutputPath;
}
export async function createCumulativeDownloadsChart(metric, outputPath) {
    const downloadsRange = metric.metrics?.downloadRange || [];
    const svgOutputPath = `${outputPath}/${metric.name.replace('/', '-')}-cumulative-release-downloads.svg`;
    const groupedDownloads = groupByReleaseCumulative(downloadsRange);
    // Sort months chronologically
    const semVerSortedReleases = Object.keys(groupedDownloads).sort((a, b) => {
        return semver.compare(a, b);
    });
    const canvas = new Canvas(1000, 800);
    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: semVerSortedReleases,
            datasets: [{
                    label: `${metric.name} Cumulative Downloads`,
                    data: semVerSortedReleases.map(release => groupedDownloads[release].downloads),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1
                }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${metric.name} - Cumulative Release Downloads`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Release'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Downloads'
                    },
                    beginAtZero: true
                }
            }
        }
    });
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' });
    writeFileSync(svgOutputPath, svgBuffer);
    chart.destroy();
    return svgOutputPath;
}
export async function createReleaseDownloadsChart(metric, outputPath) {
    const downloadsRange = metric.metrics?.downloadRange || [];
    const svgOutputPath = `${outputPath}/${metric.name.replace('/', '-')}-top-release-downloads.svg`;
    // Sort releases by date (newest first for display)
    const sortedReleases = downloadsRange
        .filter((release) => release.tagName && release.downloads > 0)
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10) // Show top 10 releases
        .sort((a, b) => semver.compare(a.tagName || '0.0.0', b.tagName || '0.0.0'));
    if (sortedReleases.length === 0) {
        // Return empty chart if no releases
        return svgOutputPath;
    }
    const canvas = new Canvas(1200, 800);
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sortedReleases.map((release) => release.tagName),
            datasets: [{
                    label: `${metric.name} Release Downloads`,
                    data: sortedReleases.map((release) => release.downloads),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${metric.name} - Top Release Downloads`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Release Tag'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Downloads'
                    },
                    beginAtZero: true
                }
            }
        }
    });
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' });
    writeFileSync(svgOutputPath, svgBuffer);
    chart.destroy();
    return svgOutputPath;
}
