import { mkdirSync, writeFileSync } from 'node:fs';
import type { MetricResult } from "../collectors/types";
import { Chart, registerables } from 'chart.js';
import { Canvas } from 'skia-canvas';

// Register all Chart.js controllers
Chart.register(...registerables);

export function formatNpmSummary(summary: string, platformMetrics: MetricResult[]): string {
    let totalDownloads = 0
    let totalMonthlyDownloads = 0
    let totalWeeklyDownloads = 0
    let totalDailyDownloads = 0

    summary += `| Package | Downloads | Monthly Downloads | Weekly Downloads | Daily Downloads |\n`
    summary += `| --- | --- | --- | --- | --- |\n`
    for (const metric of platformMetrics) {
        const downloads = metric.metrics?.downloadsTotal || 0
        const monthlyDownloads = metric.metrics?.downloadsMonthly || 0
        const weeklyDownloads = metric.metrics?.downloadsWeekly || 0
        const dailyDownloads = metric.metrics?.downloadsDaily || 0

        totalDownloads += downloads
        totalMonthlyDownloads += monthlyDownloads
        totalWeeklyDownloads += weeklyDownloads
        totalDailyDownloads += dailyDownloads

        summary += `| ${metric.name} | ${downloads.toLocaleString()} | ${monthlyDownloads.toLocaleString()} | ${weeklyDownloads.toLocaleString()} | ${dailyDownloads.toLocaleString()} |\n`
    }
    summary += `| **Total** | **${totalDownloads.toLocaleString()}** | **${totalMonthlyDownloads.toLocaleString()}** | **${totalWeeklyDownloads.toLocaleString()}** | **${totalDailyDownloads.toLocaleString()}** | | | | |\n`
    return summary
}

// Convert a list of dates into a list of Months
function groupByMonth(dateRange: { day: string, downloads: number }[]) {
    const months: Record<string, number> = {}

    for (const range of dateRange) {
        const month = new Date(range.day).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        if (!months[month]) {
            months[month] = range.downloads
        } else {
            months[month] += range.downloads
        }
    }

    return months
}

function groupByMonthCumulative(dateRange: { day: string, downloads: number }[]){
    const months: Record<string, number> = {}

    for (const range of dateRange) {
        const month = new Date(range.day).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

        if (!months[month]) {
            months[month] = range.downloads
        } else {
            months[month] += range.downloads
        }
    }

    let cumulativeDownloads = 0
    for (const month in months) {
        cumulativeDownloads += months[month]
        months[month] = cumulativeDownloads
    }

    return months
}

export async function createDownloadsPerMonthChart(metric: MetricResult, outputPath: string): Promise<string> {
    const downloadsRange = metric.metrics?.downloadsRange || []
    const svgOutputPath = `${outputPath}/${metric.name}-new-downloads-by-month.svg`
    const groupedDownloads = groupByMonth(downloadsRange)

    const canvas = new Canvas(1000, 800);
    const chart = new Chart(
        canvas as any,
        {
            type: 'line',
            data: {
                labels: Object.keys(groupedDownloads),
                datasets: [{
                    label: metric.name,
                    data: Object.values(groupedDownloads),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM DD'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Downloads per month'
                        },
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

export async function createCumulativeDownloadsChart(metric: MetricResult, outputPath: string): Promise<string> {
    const downloadsRange = metric.metrics?.downloadsRange || []
    const svgOutputPath = `${outputPath}/${metric.name}-cumulative-downloads.svg`

    const groupedDownloads = groupByMonthCumulative(downloadsRange)

    const canvas = new Canvas(1000, 800);
    const chart = new Chart(
        canvas as any,
        {
            type: 'line',
            data: {
                labels: Object.keys(groupedDownloads),
                datasets: [{
                    label: metric.name,
                    data: Object.values(groupedDownloads),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM DD'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Downloads per month'
                        },
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



export async function createNpmChart(platformMetrics: MetricResult[], outputPath: string) {
    const svgOutputPathList = []
    for (const metric of platformMetrics) {
        const svgOutputPath = await createDownloadsPerMonthChart(metric, outputPath)
        svgOutputPathList.push(svgOutputPath)
        const svgOutputPathCumulative = await createCumulativeDownloadsChart(metric, outputPath)
        svgOutputPathList.push(svgOutputPathCumulative)
    }

    return svgOutputPathList
}

export async function addNpmDetails(summary: string, platformMetrics: MetricResult[]): Promise<string> {
    const outputPath = './charts/npm'
    mkdirSync(outputPath, { recursive: true })
    const svgOutputPathList = await createNpmChart(platformMetrics, outputPath)
    for (const svgOutputPath of svgOutputPathList) {
        summary += `![${svgOutputPath}](${svgOutputPath})\n`
    }
    return summary
}