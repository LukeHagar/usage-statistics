/**
 * PyPI package statistics collector using external PyPI Stats API
 */
const PlatformSettings = {
    name: 'PyPI',
};
// (no BigQuery historical metrics; all data comes from the external API)
// External PyPI Stats API base URL
const PYPI_STATS_BASE_URL = process.env.PYPI_STATS_BASE_URL || 'https://pypistats.dev';
function normalizePackageName(name) {
    return name.replace(/[._]/g, '-').toLowerCase();
}
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Request failed ${res.status}: ${url}`);
    return res.json();
}
export async function collectPypi(packageName) {
    const normalized = normalizePackageName(packageName);
    try {
        // Package metadata
        const packageDataPromise = fetchJson(`https://pypi.org/pypi/${normalized}/json`);
        const recentPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/recent`);
        const summaryPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/summary`);
        const overallPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/overall`);
        const pythonMajorPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/python_major`);
        const pythonMinorPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/python_minor`);
        const systemPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/system`);
        const installerPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/installer`);
        const overallChartPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/chart/overall?format=json`);
        const pythonMajorChartPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/chart/python_major?format=json`);
        const pythonMinorChartPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/chart/python_minor?format=json`);
        const systemChartPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/chart/system?format=json`);
        const installerChartPromise = fetchJson(`${PYPI_STATS_BASE_URL}/api/packages/${normalized}/chart/installer?format=json`);
        const [packageData, recent, summary, overall, pythonMajor, pythonMinor, system, installer, overallChart, pythonMajorChart, pythonMinorChart, systemChart, installerChart] = await Promise.all([
            packageDataPromise,
            recentPromise,
            summaryPromise,
            overallPromise,
            pythonMajorPromise,
            pythonMinorPromise,
            systemPromise,
            installerPromise,
            overallChartPromise,
            pythonMajorChartPromise,
            pythonMinorChartPromise,
            systemChartPromise,
            installerChartPromise,
        ]);
        // All time-series and breakdowns are provided by the external API
        const overallSeries = (overall.data || []).filter(p => p.category === 'without_mirrors');
        const systemBreakdown = summary.totals?.system || null;
        const pythonVersionBreakdown = summary.totals?.python_major
            ? Object.fromEntries(Object.entries(summary.totals.python_major).filter(([k]) => /^\d+$/.test(k)).map(([k, v]) => [`python${k}`, v]))
            : null;
        const pythonMinorBreakdown = summary.totals?.python_minor
            ? Object.fromEntries(Object.entries(summary.totals.python_minor).filter(([k]) => /^\d+(?:\.\d+)?$/.test(k)).map(([k, v]) => [`python${k}`, v]))
            : null;
        // Derive popular system and installer from totals/series
        let popularSystem;
        if (systemBreakdown && Object.keys(systemBreakdown).length > 0) {
            popularSystem = Object.entries(systemBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0];
        }
        else if (system.data && system.data.length > 0) {
            const totals = {};
            for (const p of system.data)
                totals[p.category] = (totals[p.category] || 0) + p.downloads;
            popularSystem = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
        }
        let popularInstaller;
        if (installer.data && installer.data.length > 0) {
            const totals = {};
            for (const p of installer.data)
                totals[p.category] = (totals[p.category] || 0) + p.downloads;
            popularInstaller = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
        }
        // Latest release date for current version
        let latestReleaseDate;
        try {
            const currentVersion = packageData.info?.version;
            const files = currentVersion ? (packageData.releases?.[currentVersion] || []) : [];
            const latestUpload = files.reduce((max, f) => {
                const t = f.upload_time;
                if (!t)
                    return max;
                if (!max)
                    return t;
                return new Date(t) > new Date(max) ? t : max;
            }, undefined);
            if (latestUpload) {
                const d = new Date(latestUpload);
                if (!isNaN(d.getTime()))
                    latestReleaseDate = d.toISOString().slice(0, 10);
            }
        }
        catch { }
        return {
            platform: PlatformSettings.name,
            name: packageName,
            timestamp: new Date().toISOString(),
            metrics: {
                downloadsTotal: summary.totals?.overall,
                downloadsMonthly: recent.data?.last_month,
                downloadsWeekly: recent.data?.last_week,
                downloadsDaily: recent.data?.last_day,
                version: packageData.info?.version,
                latestReleaseDate,
                description: packageData.info?.summary,
                homepage: packageData.info?.home_page,
                author: packageData.info?.author,
                license: packageData.info?.license,
                requiresPython: packageData.info?.requires_python,
                releases: Object.keys(packageData.releases || {}).length,
                downloadsRange: overallSeries.map(p => ({ day: p.date, downloads: p.downloads })),
                overallSeries,
                pythonMajorSeries: (pythonMajor.data || []).filter(p => p.category?.toLowerCase?.() !== 'unknown'),
                pythonMinorSeries: (pythonMinor.data || []).filter(p => p.category?.toLowerCase?.() !== 'unknown'),
                systemSeries: system.data || [],
                installerSeries: installer.data || [],
                popularSystem,
                popularInstaller,
                // Server-prepared chart JSON (preferred for rendering)
                overallChart,
                pythonMajorChart: { ...pythonMajorChart, datasets: (pythonMajorChart.datasets || []).filter(ds => !/unknown/i.test(ds.label)) },
                pythonMinorChart: { ...pythonMinorChart, datasets: (pythonMinorChart.datasets || []).filter(ds => !/unknown/i.test(ds.label)) },
                systemChart,
                installerChart,
                pythonVersionBreakdown,
                pythonMinorBreakdown,
                systemBreakdown,
            }
        };
    }
    catch (error) {
        return {
            platform: PlatformSettings.name,
            name: packageName,
            timestamp: new Date().toISOString(),
            metrics: {},
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
export async function collectPypiBatch(packageNames) {
    const results = [];
    for (const packageName of packageNames) {
        results.push(collectPypi(packageName));
    }
    return Promise.all(results);
}
