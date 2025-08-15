/**
 * PowerShell Gallery module statistics collector with enhanced metrics
 */

import type { MetricResult } from './types';
import { XMLParser } from 'fast-xml-parser';

const PlatformSettings = {
  name: 'PowerShell',
}

const BASE_URL = 'https://www.powershellgallery.com/api/v2/';
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

export interface PowerShellGalleryEntryArray {
  "?xml": {
    version: string;
    encoding: string;
  };
  feed: {
    id: string;
    title: string;
    updated: string;
    link: {
      rel: string;
      href: string;
    };
    entry: Entry[];
  };
}

export interface PowerShellGalleryEntry {
  '?xml': {
    version: string;
    encoding: string;
  };
  entry: Entry;
}

export interface Entry {
  id: string;
  category: {
    term: string;
    scheme: string;
  };
  link: Array<{
    rel: string;
    href: string;
  }>;
  title: {
    '#text': string;
    type: string;
  };
  updated: string;
  author: {
    name: string;
  };
  content: {
    type: string;
    src: string;
  };
  'm:properties': MProperties;

  // Namespace declarations
  'xml:base': string;
  xmlns: string;
  'xmlns:d': string;
  'xmlns:m': string;
  'xmlns:georss': string;
  'xmlns:gml': string;
}

export interface MProperties {
  'd:Id': string;
  'd:Version': string;
  'd:NormalizedVersion': string;
  'd:Authors': string;
  'd:Copyright': string;
  'd:Created': EdmDateTime;
  'd:Dependencies': string;
  'd:Description': string;
  'd:DownloadCount': EdmInt32;
  'd:GalleryDetailsUrl': string;
  'd:IconUrl'?: EdmNull;
  'd:IsLatestVersion': EdmBoolean;
  'd:IsAbsoluteLatestVersion': EdmBoolean;
  'd:IsPrerelease': EdmBoolean;
  'd:Language'?: EdmNull;
  'd:LastUpdated': EdmDateTime;
  'd:Published': EdmDateTime;
  'd:PackageHash': string;
  'd:PackageHashAlgorithm': string;
  'd:PackageSize': EdmInt64;
  'd:ProjectUrl'?: EdmNull;
  'd:ReportAbuseUrl': string;
  'd:ReleaseNotes'?: EdmNull;
  'd:RequireLicenseAcceptance': EdmBoolean;
  'd:Summary'?: EdmNull;
  'd:Tags': string;
  'd:Title'?: EdmNull;
  'd:VersionDownloadCount': EdmInt32;
  'd:MinClientVersion'?: EdmNull;
  'd:LastEdited'?: EdmNull;
  'd:LicenseUrl'?: EdmNull;
  'd:LicenseNames'?: EdmNull;
  'd:LicenseReportUrl'?: EdmNull;
  'd:ItemType': string;
  'd:FileList': string;
  'd:GUID': string;
  'd:PowerShellVersion': number;
  'd:PowerShellHostVersion'?: EdmNull;
  'd:DotNetFrameworkVersion'?: EdmNull;
  'd:CLRVersion'?: EdmNull;
  'd:ProcessorArchitecture'?: EdmNull;
  'd:CompanyName': string;
  'd:Owners': string;
}

export interface EdmDateTime {
  '#text': string;
  'm:type': 'Edm.DateTime';
}

export interface EdmInt32 {
  '#text': number;
  'm:type': 'Edm.Int32';
}

export interface EdmInt64 {
  '#text': number;
  'm:type': 'Edm.Int64';
}

export interface EdmBoolean {
  '#text': boolean;
  'm:type': 'Edm.Boolean';
}

export interface EdmNull {
  'm:null': 'true';
}

type ParsedModuleEntry = {
  id: string;
  name: string;
  version: string;
  normalizedVersion: string;
  authors: string;
  description: string;
  downloadCount: number;
  versionDownloadCount: number;
  published: Date;
  lastUpdated: Date;
  created: Date;
  isLatest: boolean;
  isPrerelease: boolean;
  projectUrl?: string | null;
  reportAbuseUrl: string;
  galleryDetailsUrl: string;
  packageSize: number;
  companyName: string;
  owners: string;
};

function parsePowerShellGalleryEntry(entry: Entry): ParsedModuleEntry {
  const props = entry["m:properties"]

  const getText = (field: any): string =>
    field?.["#text"];

  const isTrue = (field: any): boolean =>
    field?.["#text"] === true;

  const getNumber = (field: any): number => field?.["#text"]

  const getDate = (field: any): Date => {
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
export async function findPackagesById(id: string) {
  const url = `${BASE_URL}FindPackagesById()?id='${encodeURIComponent(id)}'`;
  const res = await fetch(url);
  const xml = await res.text();
  const json = parser.parse(xml) as PowerShellGalleryEntryArray;
  return json.feed.entry ?? [];
}

/**
 * Fetches metadata for a specific version of a package.
 * Equivalent to: Packages(Id='Name',Version='x.y.z')
 */
export async function getPackageVersionInfo(id: string, version: string) {
  const url = `${BASE_URL}Packages(Id='${encodeURIComponent(id)}',Version='${encodeURIComponent(version)}')`;
  const res = await fetch(url);
  const xml = await res.text();
  const json = parser.parse(xml) as PowerShellGalleryEntry;
  return json.entry
}

/**
 * Searches the PowerShell Gallery with a search term.
 * Equivalent to: Search()?searchTerm='term'&includePrerelease=false
 */
export async function searchPackages(searchTerm: string, includePrerelease = false) {
  const url = `${BASE_URL}Search()?searchTerm='${encodeURIComponent(
    searchTerm
  )}'&includePrerelease=${includePrerelease.toString()}`;
  const res = await fetch(url);
  const xml = await res.text();
  const json = parser.parse(xml);
  return json.feed?.entry ?? [];
}

/**
 * Sum total download count for all versions of a package.
 */
export async function getTotalDownloadCount(id: string): Promise<number> {
  const entries = await findPackagesById(id);
  const versions = Array.isArray(entries) ? entries : [entries];

  return versions.reduce((sum, entry) => {
    const count = (entry as any)['m:properties']?.['d:DownloadCount']?.['#text']
    return sum + count;
  }, 0);
}

export async function collectPowerShell(moduleName: string): Promise<MetricResult> {
  try {
    // Get all versions of the package
    const allVersions = await findPackagesById(moduleName);
    if (!allVersions || allVersions.length === 0) {
      throw new Error(`Module ${moduleName} not found`);
    }

    const versions: ParsedModuleEntry[] = []

    for (const version of allVersions) {
      const parsedVersion = parsePowerShellGalleryEntry(version)
      versions.push(parsedVersion)
    }
    
    // Sort versions by published date (newest first)
    const sortedVersions = versions.sort((a, b) => b.published.getTime() - a.published.getTime())

    let downloadsTotal = 0;
    let latestVersionDownloads = 0;
    let downloadRange: Array<{day: string, downloads: number, version: string}> = [];
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
      }

      // Add to download range for charts
      downloadRange.push(rangeEntry);
    }

    // Get latest version metadata
    const latestModuleData = sortedVersions[0];

    const result: MetricResult = {
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

  } catch (error) {
    console.warn('Error collecting PowerShell module:', error);
    return {
      platform: PlatformSettings.name,
      name: moduleName,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function collectPowerShellBatch(moduleNames: string[]): Promise<MetricResult[]> {
  const resultPromises: Promise<MetricResult>[] = []

  for (const moduleName of moduleNames) {
    resultPromises.push(collectPowerShell(moduleName))
  }
  
  return Promise.all(resultPromises)
}