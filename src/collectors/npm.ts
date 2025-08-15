/**
 * NPM package statistics collector with enhanced metrics
 */

import type { MetricResult } from './types';

const PlatformSettings = {
  name: 'NPM',
}

interface NpmPackageInfo {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
  repository?: { url: string };
  maintainers?: Array<{ name: string; email: string }>;
  'dist-tags'?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  time?: Record<string, string>;
  versions?: Record<string, any>;
}

interface NpmDownloadStats {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

const BASE_URL = 'https://api.npmjs.org/downloads/range';
const CHUNK_DAYS = 540; // 18 months max per request
const START_DATE = new Date('2015-01-10'); // Earliest NPM data

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function fetchChunk(start: Date, end: Date, packageName: string): Promise<{ day: string; downloads: number }[]> {
  const url = `${BASE_URL}/${formatDate(start)}:${formatDate(end)}/${packageName}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.downloads;
}

async function getFullDownloadHistory(packageName: string, startDate: Date): Promise<{ day: string; downloads: number }[]> {
  const today = new Date();
  let currentStart = new Date(startDate);
  let allDownloads: { day: string; downloads: number }[] = [];

  while (currentStart < today) {
    const currentEnd = addDays(currentStart, CHUNK_DAYS - 1);
    const end = currentEnd > today ? today : currentEnd;

    console.log(`Fetching ${formatDate(currentStart)} to ${formatDate(end)}...`);

    const chunk = await fetchChunk(currentStart, end, packageName);
    allDownloads = allDownloads.concat(chunk);

    currentStart = addDays(end, 1); // move to next chunk
  }

  return Array.from(new Set(allDownloads));
}


export async function collectNpm(packageName: string): Promise<MetricResult> {
  try {
    // Get package info from npm registry
    const packageUrl = `https://registry.npmjs.org/${packageName}`;
    const packageResponse = await fetch(packageUrl);
    const packageData: NpmPackageInfo = await packageResponse.json();

    // Get download statistics
    let downloadsMonthly
    let downloadsWeekly
    let downloadsDaily

    try {
      // Monthly downloads
      const monthlyUrl = `https://api.npmjs.org/downloads/point/last-month/${packageName}`;
      const monthlyResponse = await fetch(monthlyUrl);
      const monthlyData: NpmDownloadStats = await monthlyResponse.json();
      downloadsMonthly = monthlyData.downloads || null;
    } catch (error) {
      console.warn(`Could not fetch NPM monthly downloads for ${packageName}:`, error);
    }

    try {
      // Weekly downloads
      const weeklyUrl = `https://api.npmjs.org/downloads/point/last-week/${packageName}`;
      const weeklyResponse = await fetch(weeklyUrl);
      const weeklyData: NpmDownloadStats = await weeklyResponse.json();
      downloadsWeekly = weeklyData.downloads || null;
    } catch (error) {
      console.warn(`Could not fetch NPM weekly downloads for ${packageName}:`, error);
    }

    try {
      // Daily downloads
      const dailyUrl = `https://api.npmjs.org/downloads/point/last-day/${packageName}`;
      const dailyResponse = await fetch(dailyUrl);
      const dailyData: NpmDownloadStats = await dailyResponse.json();
      downloadsDaily = dailyData.downloads || null;
    } catch (error) {
      console.warn(`Could not fetch NPM daily downloads for ${packageName}:`, error);
    }

    const downloadsRange = await getFullDownloadHistory(packageName, new Date(packageData.time?.created || START_DATE))

    const downloadsTotal = downloadsRange.reduce((acc, curr) => acc + curr.downloads, 0)

    return {
      platform: PlatformSettings.name,
      name: packageName,
      timestamp: new Date().toISOString(),
      metrics: {
        downloadsTotal,
        downloadsMonthly,
        downloadsWeekly,
        downloadsDaily,
        downloadsRange,
      }
    };
  } catch (error) {
    return {
      platform: PlatformSettings.name,
      name: packageName,
      timestamp: new Date().toISOString(),
      metrics: {},
      error: error instanceof Error ? error.message : String(error)
    };
  }
}


export async function collectNpmBatch(packageNames: string[]): Promise<MetricResult[]> {
  const resultPromises: Promise<MetricResult>[] = []
  for (const packageName of packageNames) {
    resultPromises.push(collectNpm(packageName))
  }
  return Promise.all(resultPromises)
}