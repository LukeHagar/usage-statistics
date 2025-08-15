import { mkdirSync, writeFileSync } from "fs"
import type { MetricResult } from "../collectors/types"
import { Chart, registerables } from 'chart.js';
import { Canvas } from 'skia-canvas';

// Register all Chart.js controllers
Chart.register(...registerables);

export function formatPowerShellSummary(summary: string, platformMetrics: MetricResult[]): string {
    let platformDownloadTotal = 0
    let totalVersions = 0
    
    summary += `| Module | Total Downloads | Latest Version | Version Downloads | Versions | Last Updated |\n`
    summary += `| --- | --- | --- | --- | --- | --- |\n`
    for (const metric of platformMetrics) {
        const lastUpdated = metric.metrics?.lastUpdated ? new Date(metric.metrics.lastUpdated).toLocaleDateString() : 'N/A'
        const latestVersion = metric.metrics?.latestVersion || 'N/A'
        const latestVersionDownloads = metric.metrics?.latestVersionDownloads || 0
        const versionCount = metric.metrics?.versionCount || 0
        
        summary += `| ${metric.name} | ${metric.metrics?.downloadsTotal?.toLocaleString() || 0} | ${latestVersion} | ${latestVersionDownloads.toLocaleString()} | ${versionCount} | ${lastUpdated} |\n`
        platformDownloadTotal += metric.metrics?.downloadsTotal || 0
        totalVersions += versionCount
    }
    summary += `| **Total** | **${platformDownloadTotal.toLocaleString()}** | | | **${totalVersions}** | |\n`

    return summary
}

export async function addPowerShellDetails(summary: string, platformMetrics: MetricResult[]): Promise<string> {
    summary += `#### PowerShell Module Details:\n\n`
    
    for (const metric of platformMetrics) {
        summary += `**${metric.name}**:\n`
        summary += `- Total Downloads: ${metric.metrics?.downloadsTotal?.toLocaleString() || 0}\n`
        summary += `- Latest Version: ${metric.metrics?.latestVersion || 'N/A'}\n`
        summary += `- Latest Version Downloads: ${metric.metrics?.latestVersionDownloads?.toLocaleString() || 0}\n`
        summary += `- Version Count: ${metric.metrics?.versionCount || 0}\n`
        summary += `- Last Updated: ${metric.metrics?.lastUpdated ? new Date(metric.metrics.lastUpdated).toLocaleDateString() : 'N/A'}\n`
        summary += `- Package Size: ${metric.metrics?.packageSize ? `${Math.round(metric.metrics.packageSize / 1024)} KB` : 'N/A'}\n`
        summary += `\n`
    }

    summary += `\n\n`

    const chartOutputPath = './charts/powershell'
    mkdirSync(chartOutputPath, { recursive: true })
    const svgOutputPathList = await createPowerShellCharts(platformMetrics, chartOutputPath)
    for (const svgOutputPath of svgOutputPathList) {
        summary += `![${svgOutputPath}](${svgOutputPath})\n`
    }
    return summary
}

export async function createPowerShellCharts(platformMetrics: MetricResult[], outputPath: string) {
    const svgOutputPathList = []
    
    // Only create charts if there's download data
    const metricsWithData = platformMetrics.filter(metric => 
        metric.metrics?.downloadsRange && metric.metrics.downloadsRange.length > 0
    );
    
    if (metricsWithData.length > 0) {
        const svgOutputPath = await createCombinedDownloadsChart(metricsWithData, outputPath)
        svgOutputPathList.push(svgOutputPath)
        
        const svgOutputPathCumulative = await createCombinedCumulativeDownloadsChart(metricsWithData, outputPath)
        svgOutputPathList.push(svgOutputPathCumulative)
    }

    return svgOutputPathList
}

// Color palette for different modules
const colors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)'
];

const borderColors = [
    'rgba(54, 162, 235, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(255, 205, 86, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)'
];

export async function createCombinedDownloadsChart(metrics: MetricResult[], outputPath: string): Promise<string> {
    const svgOutputPath = `${outputPath}/powershell-combined-downloads.svg`
    
    // Get all unique dates across all modules for the x-axis
    const allDates = new Set<string>();
    for (const metric of metrics) {
        const downloadsRange = metric.metrics?.downloadsRange || [];
        for (const download of downloadsRange) {
            allDates.add(download.day);
        }
    }
    
    // Sort all dates chronologically
    const sortedAllDates = Array.from(allDates).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
    );
    
    // Create datasets for each module (one line per module)
    const data = []
    for (const metric of metrics) {
        const downloadsRange = metric.metrics?.downloadsRange || [];
        for (const date of sortedAllDates) {
            const downloads = downloadsRange.filter(d => d.day === date).reduce((sum, d) => sum + d.downloads, 0);
            data.push(downloads);
        }
    }
    
    const labels = sortedAllDates.map(date => 
        new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit',
            day: 'numeric'
        })
    );

    const canvas = new Canvas(1200, 800);
    const chart = new Chart(
        canvas as any,
        {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
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
                        text: 'PowerShell Modules - Downloads Over Time',
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
                            text: 'Release Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Downloads'
                        },
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1000
                        }
                    }
                }
            }
        }
    );
    
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' });
    writeFileSync(svgOutputPath, svgBuffer);
    chart.destroy();

    return svgOutputPath
}

export async function createCombinedCumulativeDownloadsChart(metrics: MetricResult[], outputPath: string): Promise<string> {
    const svgOutputPath = `${outputPath}/powershell-cumulative-downloads.svg`
    
    // Get all unique dates across all modules for the x-axis
    const allDates = new Set<string>();
    for (const metric of metrics) {
        const downloadsRange = metric.metrics?.downloadsRange || [];
        for (const download of downloadsRange) {
            allDates.add(download.day);
        }
    }
    
    // Sort all dates chronologically
    const sortedAllDates = Array.from(allDates).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
    );
    
    const labels = sortedAllDates.map(date => 
        new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit',
            day: 'numeric'
        })
    );

    const data = []
    let runningTotal = 0
    for (const date of sortedAllDates) {
        const downloads = metrics.reduce((sum, metric) => sum + (metric.metrics?.downloadsRange?.find(d => d.day === date)?.downloads || 0), 0);
        runningTotal += downloads
        data.push(runningTotal);
    }

    const canvas = new Canvas(1200, 800);
    const chart = new Chart(
        canvas as any,
        {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Downloads',
                    data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
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
                        text: 'PowerShell Modules - Cumulative Downloads',
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
                            text: 'Release Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Cumulative Downloads'
                        },
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5000
                        }
                    }
                }
            }
        }
    );
    
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' });
    writeFileSync(svgOutputPath, svgBuffer);
    chart.destroy();

    return svgOutputPath
}