import { describe, it, expect, beforeEach } from "bun:test";
import { UsageStatisticsManager } from "./index";
import { getConfig } from "./config";

describe("UsageStatisticsManager", () => {
  let manager: UsageStatisticsManager;

  beforeEach(() => {
    const config = getConfig('test');
    manager = new UsageStatisticsManager(config);
  });

  describe("generateComprehensiveReport", () => {
    it("should generate a report with aggregated stats", async () => {
      const report = await manager.generateComprehensiveReport();
      
      expect(report).toBeDefined();
      expect(report.totalDownloads).toBeGreaterThanOrEqual(0);
      expect(report.uniquePackages).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.platforms)).toBe(true);
      expect(Array.isArray(report.topPackages)).toBe(true);
      expect(Array.isArray(report.recentActivity)).toBe(true);
      expect(typeof report.platformBreakdown).toBe('object');
    }, 30000); // 30 second timeout
  });

  describe("getPlatformReport", () => {
    it("should generate a report for a specific platform", async () => {
      const report = await manager.getPlatformReport('npm');
      
      expect(report).toBeDefined();
      expect(report.totalDownloads).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.platforms)).toBe(true);
    });
  });

  describe("exportReport", () => {
    it("should export JSON report", async () => {
      const jsonReport = await manager.exportReport('json');
      
      expect(jsonReport).toBeDefined();
      expect(typeof jsonReport).toBe('string');
      
      // Should be valid JSON
      const parsed = JSON.parse(jsonReport);
      expect(parsed).toBeDefined();
    }, 30000); // 30 second timeout

    it("should export CSV report", async () => {
      const csvReport = await manager.exportReport('csv');
      
      expect(csvReport).toBeDefined();
      expect(typeof csvReport).toBe('string');
      expect(csvReport.includes('Platform,Package,Downloads')).toBe(true);
    }, 30000); // 30 second timeout
  });

  describe("getLastUpdateTime", () => {
    it("should return null initially", () => {
      const lastUpdate = manager.getLastUpdateTime();
      expect(lastUpdate).toBeNull();
    });

    it("should return update time after generating report", async () => {
      await manager.generateComprehensiveReport();
      const lastUpdate = manager.getLastUpdateTime();
      
      expect(lastUpdate).not.toBeNull();
      expect(lastUpdate).toBeInstanceOf(Date);
    });
  });
});

describe("Configuration", () => {
  it("should load development config", () => {
    const config = getConfig('development');
    
    expect(config).toBeDefined();
    expect(config.enableLogging).toBe(true);
    expect(config.updateInterval).toBe(5 * 60 * 1000); // 5 minutes
  });

  it("should load production config", () => {
    const config = getConfig('production');
    
    expect(config).toBeDefined();
    expect(config.enableLogging).toBe(false);
    expect(config.updateInterval).toBe(60 * 60 * 1000); // 1 hour
  });

  it("should load default config", () => {
    const config = getConfig('default');
    
    expect(config).toBeDefined();
    expect(config.enableLogging).toBe(true);
    expect(config.updateInterval).toBe(60 * 60 * 1000); // 1 hour
  });
}); 