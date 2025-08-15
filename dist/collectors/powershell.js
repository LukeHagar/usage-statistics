/**
 * PowerShell Gallery module statistics collector with enhanced metrics
 */
import { XMLParser } from 'fast-xml-parser';
const PlatformSettings = {
    name: 'PowerShell',
};
const BASE_URL = 'https://www.powershellgallery.com/api/v2/';
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
});
function parsePowerShellGalleryEntry(entry) {
    const props = entry["m:properties"];
    const getText = (field) => field?.["#text"];
    const isTrue = (field) => field?.["#text"] === true;
    const getNumber = (field) => field?.["#text"];
    const getDate = (field) => {
        const dateText = getText(field);
        if (!dateText || dateText === '') {
            return new Date(0); // Return epoch date for invalid dates
        }
        return new Date(dateText);
    };
    return {
        id: entry.id,
        name: props["d:Id"],
        version: props["d:Version"],
        normalizedVersion: props["d:NormalizedVersion"],
        authors: props["d:Authors"],
        description: props["d:Description"],
        downloadCount: getNumber(props["d:DownloadCount"]),
        versionDownloadCount: getNumber(props["d:VersionDownloadCount"]),
        published: getDate(props["d:Published"]),
        lastUpdated: getDate(props["d:LastUpdated"]),
        created: getDate(props["d:Created"]),
        isLatest: isTrue(props["d:IsLatestVersion"]),
        isPrerelease: isTrue(props["d:IsPrerelease"]),
        projectUrl: getText(props["d:ProjectUrl"]) ?? undefined,
        reportAbuseUrl: props["d:ReportAbuseUrl"],
        galleryDetailsUrl: props["d:GalleryDetailsUrl"],
        packageSize: getNumber(props["d:PackageSize"]),
        companyName: props["d:CompanyName"],
        owners: props["d:Owners"],
    };
}
/**
 * Fetches all versions of a package.
 * Equivalent to: FindPackagesById()?id='PackageName'
 */
export async function findPackagesById(id) {
    const url = `${BASE_URL}FindPackagesById()?id='${encodeURIComponent(id)}'`;
    const res = await fetch(url);
    const xml = await res.text();
    const json = parser.parse(xml);
    return json.feed.entry ?? [];
}
/**
 * Fetches metadata for a specific version of a package.
 * Equivalent to: Packages(Id='Name',Version='x.y.z')
 */
export async function getPackageVersionInfo(id, version) {
    const url = `${BASE_URL}Packages(Id='${encodeURIComponent(id)}',Version='${encodeURIComponent(version)}')`;
    const res = await fetch(url);
    const xml = await res.text();
    const json = parser.parse(xml);
    return json.entry;
}
/**
 * Searches the PowerShell Gallery with a search term.
 * Equivalent to: Search()?searchTerm='term'&includePrerelease=false
 */
export async function searchPackages(searchTerm, includePrerelease = false) {
    const url = `${BASE_URL}Search()?searchTerm='${encodeURIComponent(searchTerm)}'&includePrerelease=${includePrerelease.toString()}`;
    const res = await fetch(url);
    const xml = await res.text();
    const json = parser.parse(xml);
    return json.feed?.entry ?? [];
}
/**
 * Sum total download count for all versions of a package.
 */
export async function getTotalDownloadCount(id) {
    const entries = await findPackagesById(id);
    const versions = Array.isArray(entries) ? entries : [entries];
    return versions.reduce((sum, entry) => {
        const count = entry['m:properties']?.['d:DownloadCount']?.['#text'];
        return sum + count;
    }, 0);
}
export async function collectPowerShell(moduleName) {
    try {
        // Get all versions of the package
        const allVersions = await findPackagesById(moduleName);
        if (!allVersions || allVersions.length === 0) {
            throw new Error(`Module ${moduleName} not found`);
        }
        const versions = [];
        for (const version of allVersions) {
            const parsedVersion = parsePowerShellGalleryEntry(version);
            versions.push(parsedVersion);
        }
        // Sort versions by published date (newest first)
        const sortedVersions = versions.sort((a, b) => b.published.getTime() - a.published.getTime());
        let downloadsTotal = 0;
        let latestVersionDownloads = 0;
        let downloadRange = [];
        let latestVersion = '';
        let latestVersionDate = '';
        // Process each version
        for (const version of sortedVersions) {
            // Use Created date if Published date is invalid (1900-01-01)
            const effectiveDate = version.published.getTime() === new Date('1900-01-01T00:00:00').getTime()
                ? version.created
                : version.published;
            // Skip versions with invalid dates
            if (effectiveDate.getTime() === 0) {
                continue;
            }
            downloadsTotal += version.versionDownloadCount;
            // Track latest version downloads
            if (version.isLatest) {
                latestVersionDownloads = version.versionDownloadCount;
                latestVersion = version.version;
                latestVersionDate = effectiveDate.toISOString();
            }
            const rangeEntry = {
                day: effectiveDate.toISOString(),
                downloads: version.versionDownloadCount,
                version: version.version
            };
            // Add to download range for charts
            downloadRange.push(rangeEntry);
        }
        // Get latest version metadata
        const latestModuleData = sortedVersions[0];
        const result = {
            platform: PlatformSettings.name,
            name: moduleName,
            timestamp: new Date().toISOString(),
            metrics: {
                downloadsTotal,
                downloadsRange: downloadRange,
                latestVersionDownloads,
                latestVersion,
                latestVersionDate,
                versionCount: versions.length,
                lastUpdated: latestModuleData.lastUpdated.toISOString(),
                // Additional metadata
                authors: latestModuleData.authors,
                description: latestModuleData.description,
                projectUrl: latestModuleData.projectUrl,
                packageSize: latestModuleData.packageSize,
                companyName: latestModuleData.companyName,
                owners: latestModuleData.owners,
            }
        };
        return result;
    }
    catch (error) {
        console.warn('Error collecting PowerShell module:', error);
        return {
            platform: PlatformSettings.name,
            name: moduleName,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function collectPowerShellBatch(moduleNames) {
    const resultPromises = [];
    for (const moduleName of moduleNames) {
        resultPromises.push(collectPowerShell(moduleName));
    }
    return Promise.all(resultPromises);
}
