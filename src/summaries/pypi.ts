import { mkdirSync, writeFileSync } from 'node:fs'
import type { MetricResult } from "../collectors/types"
import { Chart, registerables } from 'chart.js'
import { Canvas } from 'skia-canvas'

Chart.register(...registerables)

export function formatPypiSummary(summary: string, platformMetrics: MetricResult[]): string {
    summary += `| Package | Total Downloads | Monthly Downloads | Weekly Downloads | Daily Downloads | Version |\n`
    summary += `| --- | --- | --- | --- | --- | --- |\n`
    for (const metric of platformMetrics) {
        summary += `| ${metric.name} | ${metric.metrics?.downloadsTotal?.toLocaleString() || 0} | ${metric.metrics?.downloadsMonthly?.toLocaleString() || 0} | ${metric.metrics?.downloadsWeekly?.toLocaleString() || 0} | ${metric.metrics?.downloadsDaily?.toLocaleString() || 0} | ${metric.metrics?.version || 'N/A'} |\n`
    }
    summary += `| **Total** | **${platformMetrics.reduce((sum, m) => sum + (m.metrics?.downloadsTotal || 0), 0).toLocaleString()}** | **${platformMetrics.reduce((sum, m) => sum + (m.metrics?.downloadsMonthly || 0), 0).toLocaleString()}** | **${platformMetrics.reduce((sum, m) => sum + (m.metrics?.downloadsWeekly || 0), 0).toLocaleString()}** | **${platformMetrics.reduce((sum, m) => sum + (m.metrics?.downloadsDaily || 0), 0).toLocaleString()}** | | |\n`
    return summary
}

function toIsoMonth(dateStr: string) {
    // input expected YYYY-MM-DD; fallback to Date parse if needed
    const iso = dateStr?.slice(0, 7)
    if (iso && /\d{4}-\d{2}/.test(iso)) return iso
    const d = new Date(dateStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
}

function displayMonthLabel(isoMonth: string) {
    const [y, m] = isoMonth.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function aggregateMonthlyTotals(points: { date: string, downloads: number }[]) {
    const totals: Record<string, number> = {}
    for (const p of points) {
        const iso = toIsoMonth(p.date)
        totals[iso] = (totals[iso] || 0) + p.downloads
    }
    const labelsIso = Object.keys(totals).sort()
    const labels = labelsIso.map(displayMonthLabel)
    const data = labelsIso.map(l => totals[l])
    return { labels, data }
}

function aggregateMonthlyByCategory(points: { date: string, category: string, downloads: number }[]) {
    const labelIsoSet = new Set<string>()
    const categoryMap: Record<string, Record<string, number>> = {}
    for (const p of points) {
        const iso = toIsoMonth(p.date)
        labelIsoSet.add(iso)
        if (!categoryMap[p.category]) categoryMap[p.category] = {}
        categoryMap[p.category][iso] = (categoryMap[p.category][iso] || 0) + p.downloads
    }
    const labelsIso = Array.from(labelIsoSet).sort()
    const labels = labelsIso.map(displayMonthLabel)
    return { labelsIso, labels, categoryMap }
}

async function createOverallDownloadsChart(metric: MetricResult, outputPath: string) {
    // Prefer server-prepared chart JSON if present
    const server = metric.metrics?.overallChart as { labels?: string[], datasets?: { label: string, data: number[] }[] } | undefined
    let labels: string[]
    let datasets: { label: string, data: number[], borderColor?: string, backgroundColor?: string, borderWidth?: number, fill?: boolean, tension?: number }[]
    if (server && server.labels && server.labels.length && server.datasets && server.datasets.length) {
        labels = server.labels
        const colorFor = (label?: string, idx?: number) => {
            const l = (label || '').toLowerCase()
            if (l.includes('without')) return { stroke: '#2563eb', fill: '#2563eb33' } // blue
            if (l.includes('with')) return { stroke: '#64748b', fill: '#64748b33' } // slate
            const palette = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed']
            const i = idx ?? 0
            return { stroke: palette[i % palette.length], fill: palette[i % palette.length] + '33' }
        }
        datasets = server.datasets.map((ds, i) => {
            const c = colorFor(ds.label, i)
            return {
                ...ds,
                borderColor: c.stroke,
                backgroundColor: c.fill,
                borderWidth: 3,
                fill: true,
                tension: 0.1,
            }
        })
    } else {
        const series = (metric.metrics?.overallSeries as { date: string, category: string, downloads: number }[] | undefined) || []
        const agg = aggregateMonthlyTotals(series.map(p => ({ date: p.date, downloads: p.downloads })))
        labels = agg.labels
        datasets = [{
            label: `${metric.name} downloads per month`,
            data: agg.data,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.1
        }]
    }

    const canvas = new Canvas(1000, 800)
    const chart = new Chart(canvas as any, {
        type: 'line',
        data: { labels, datasets },
        options: {
            plugins: {
                legend: { display: true, position: 'bottom' },
                title: { display: true, text: `${metric.name} overall downloads` }
            },
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Downloads' } }
            }
        }
    })
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' })
    const svgPath = `${outputPath}/${metric.name}-pypi-overall.svg`
    writeFileSync(svgPath, svgBuffer)
    chart.destroy()
    return svgPath
}

// Time-series: Python major over time (line)
async function createPythonMajorChart(metric: MetricResult, outputPath: string) {
    // Prefer server chart JSON if present
    const server = metric.metrics?.pythonMajorChart as { labels?: string[], datasets?: { label: string, data: number[] }[] } | undefined
    let labels: string[]
    let datasets: { label: string, data: number[], borderColor?: string, backgroundColor?: string, borderWidth?: number, fill?: boolean }[]
    if (server && server.labels && server.labels.length && server.datasets && server.datasets.length) {
        const palette = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#dc2626', '#0ea5e9']
        labels = server.labels
        datasets = server.datasets
            .filter(ds => !/unknown/i.test(ds.label))
            .map((ds, idx) => ({
                ...ds,
                borderColor: palette[idx % palette.length],
                backgroundColor: palette[idx % palette.length] + '33',
                borderWidth: 2,
                fill: false,
            }))
    } else {
        const points = (metric.metrics?.pythonMajorSeries as { date: string, category: string, downloads: number }[] | undefined) || []
        const { labelsIso, labels: lbls, categoryMap } = aggregateMonthlyByCategory(points)
        labels = lbls
        const sortedCategories = Object.keys(categoryMap).filter(k => !/unknown/i.test(k)).sort((a, b) => Number(a) - Number(b))
        const palette = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#dc2626', '#0ea5e9']
        datasets = sortedCategories.map((category, idx) => ({
            label: `Python ${category}`,
            data: labelsIso.map(l => categoryMap[category][l] || 0),
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            fill: false,
        }))
    }

    const canvas = new Canvas(1000, 800)
    const chart = new Chart(canvas as any, {
        type: 'line',
        data: { labels, datasets },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: `${metric.name} downloads by Python major version` }
            },
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Downloads' } }
            }
        }
    })
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' })
    const svgPath = `${outputPath}/${metric.name}-pypi-python-major.svg`
    writeFileSync(svgPath, svgBuffer)
    chart.destroy()
    return svgPath
}

// Time-series: Python minor over time (line)
async function createPythonMinorChart(metric: MetricResult, outputPath: string) {
    // Prefer server chart JSON if present
    const server = metric.metrics?.pythonMinorChart as { labels?: string[], datasets?: { label: string, data: number[] }[] } | undefined
    let labels: string[]
    let datasets: { label: string, data: number[], borderColor?: string, backgroundColor?: string, borderWidth?: number, fill?: boolean }[]
    if (server && server.labels && server.labels.length && server.datasets && server.datasets.length) {
        const palette = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#6d28d9', '#0e7490', '#b91c1c', '#0284c7']
        labels = server.labels
        datasets = server.datasets
            .filter(ds => !/unknown/i.test(ds.label))
            .map((ds, idx) => ({
                ...ds,
                borderColor: palette[idx % palette.length],
                backgroundColor: palette[idx % palette.length] + '33',
                borderWidth: 2,
                fill: false,
            }))
    } else {
        const points = (metric.metrics?.pythonMinorSeries as { date: string, category: string, downloads: number }[] | undefined) || []
        const { labelsIso, labels: lbls, categoryMap } = aggregateMonthlyByCategory(points)
        labels = lbls
        const sortedCategories = Object.keys(categoryMap).filter(k => !/unknown/i.test(k)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        const palette = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#6d28d9', '#0e7490', '#b91c1c', '#0284c7']
        datasets = sortedCategories.map((category, idx) => ({
            label: `Python ${category}`,
            data: labelsIso.map(l => categoryMap[category][l] || 0),
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            fill: false,
        }))
    }

    const canvas = new Canvas(1000, 800)
    const chart = new Chart(canvas as any, {
        type: 'line',
        data: { labels, datasets },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: `${metric.name} downloads by Python minor version` }
            },
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Downloads' } }
            }
        }
    })
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' })
    const svgPath = `${outputPath}/${metric.name}-pypi-python-minor.svg`
    writeFileSync(svgPath, svgBuffer)
    chart.destroy()
    return svgPath
}

// Time-series: Installer over time (line) - prefer server JSON
async function createInstallerChart(metric: MetricResult, outputPath: string) {
    const server = metric.metrics?.installerChart as { labels?: string[], datasets?: { label: string, data: number[] }[] } | undefined
    let labels: string[]
    let datasets: { label: string, data: number[], borderColor?: string, backgroundColor?: string, borderWidth?: number, fill?: boolean }[]
    if (server && server.labels && server.labels.length && server.datasets && server.datasets.length) {
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#22d3ee']
        labels = server.labels
        datasets = server.datasets.map((ds, idx) => ({
            ...ds,
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            fill: false,
        }))
    } else {
        const points = (metric.metrics?.installerSeries as { date: string, category: string, downloads: number }[] | undefined) || []
        const { labelsIso, labels: lbls, categoryMap } = aggregateMonthlyByCategory(points)
        labels = lbls
        const categories = Object.keys(categoryMap)
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#22d3ee']
        datasets = categories.map((category, idx) => ({
            label: category,
            data: labelsIso.map(l => categoryMap[category][l] || 0),
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            fill: false,
        }))
    }

    const canvas = new Canvas(1000, 800)
    const chart = new Chart(canvas as any, {
        type: 'line',
        data: { labels, datasets },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: `${metric.name} downloads by installer` }
            },
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Downloads' } }
            }
        }
    })
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' })
    const svgPath = `${outputPath}/${metric.name}-pypi-installer.svg`
    writeFileSync(svgPath, svgBuffer)
    chart.destroy()
    return svgPath
}

// Time-series: System over time (line) - prefer server JSON
async function createSystemChart(metric: MetricResult, outputPath: string) {
    const server = metric.metrics?.systemChart as { labels?: string[], datasets?: { label: string, data: number[] }[] } | undefined
    let labels: string[]
    let datasets: { label: string, data: number[], borderColor?: string, backgroundColor?: string, borderWidth?: number, fill?: boolean }[]
    if (server && server.labels && server.labels.length && server.datasets && server.datasets.length) {
        const palette = ['#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6', '#06b6d4']
        labels = server.labels
        datasets = server.datasets.map((ds, idx) => ({
            ...ds,
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            fill: false,
        }))
    } else {
        const points = (metric.metrics?.systemSeries as { date: string, category: string, downloads: number }[] | undefined) || []
        const { labelsIso, labels: lbls, categoryMap } = aggregateMonthlyByCategory(points)
        labels = lbls
        const sortedCategories = Object.keys(categoryMap).sort()
        const palette = ['#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6', '#06b6d4']
        datasets = sortedCategories.map((category, idx) => ({
            label: category,
            data: labelsIso.map(l => categoryMap[category][l] || 0),
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            fill: false,
        }))
    }

    const canvas = new Canvas(1000, 800)
    const chart = new Chart(canvas as any, {
        type: 'line',
        data: { labels, datasets },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: `${metric.name} downloads by OS` }
            },
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Downloads' } }
            }
        }
    })
    const svgBuffer = await canvas.toBuffer('svg', { matte: 'white' })
    const svgPath = `${outputPath}/${metric.name}-pypi-system.svg`
    writeFileSync(svgPath, svgBuffer)
    chart.destroy()
    return svgPath
}

// Removed static bar chart generators per request

async function createPypiCharts(metrics: MetricResult[], basePath: string) {
    const outputPaths: string[] = []
    for (const metric of metrics) {
        const packagePath = `${basePath}`
        mkdirSync(packagePath, { recursive: true })
        const overall = await createOverallDownloadsChart(metric, packagePath)
        outputPaths.push(overall)
        const pythonMajor = await createPythonMajorChart(metric, packagePath)
        outputPaths.push(pythonMajor)
        const pythonMinor = await createPythonMinorChart(metric, packagePath)
        outputPaths.push(pythonMinor)
        const installer = await createInstallerChart(metric, packagePath)
        outputPaths.push(installer)
        const system = await createSystemChart(metric, packagePath)
        outputPaths.push(system)
        // static bar charts removed
    }
    return outputPaths
}

export function addPypiDetails(summary: string, metrics: MetricResult[]): string {
    summary += `#### Package Details:\n\n`
    for (const metric of metrics) {
        summary += `**${metric.name}**:\n`
        summary += `- Version: ${metric.metrics?.version || 'N/A'}\n`
        if (metric.metrics?.latestReleaseDate) summary += `- Released: ${metric.metrics.latestReleaseDate}\n`
        if (metric.metrics?.popularSystem) summary += `- Popular system: ${metric.metrics.popularSystem}\n`
        if (metric.metrics?.popularInstaller) summary += `- Popular installer: ${metric.metrics.popularInstaller}\n`
        summary += `- Releases: ${metric.metrics?.releases || 0}\n`
        if (metric.metrics?.systemBreakdown) {
            summary += `- OS Usage Breakdown \n`
            for (const [key, value] of Object.entries(metric.metrics?.systemBreakdown)) {
                summary += `  - ${key}: ${value}\n`
            }
        }
        if (metric.metrics?.pythonVersionBreakdown) {
            summary += `- Python Version Breakdown \n`
            for (const [key, value] of Object.entries(metric.metrics?.pythonVersionBreakdown)) {
                summary += `  - ${key}: ${value}\n`
            }
        }
    }
    return summary
}

export async function addPypiCharts(summary: string, platformMetrics: MetricResult[]): Promise<string> {
    const outputPath = './charts/pypi'
    mkdirSync(outputPath, { recursive: true })
    summary += `\n\n`
    const svgPaths = await createPypiCharts(platformMetrics, outputPath)
    for (const p of svgPaths) {
        summary += `![${p}](${p})\n`
    }
    return summary
}