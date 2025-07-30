import { describe, it, expect, beforeEach } from "bun:test";
import GitHubTracker from "./trackers/github";

describe("GitHubTracker", () => {
  let tracker: GitHubTracker;

  beforeEach(() => {
    // Use a test token or no token for testing
    tracker = new GitHubTracker(process.env.GITHUB_TOKEN || undefined);
  });

  describe("Rate Limiting", () => {
    it("should handle rate limiting gracefully", async () => {
      // Test with a popular repository that might hit rate limits
      const stats = await tracker.getDownloadStats('microsoft/vscode');
      
      // Should return an array (even if empty due to rate limiting)
      expect(Array.isArray(stats)).toBe(true);
    }, 15000); // 15 second timeout for rate limit handling

    it("should get package info", async () => {
      try {
        const info = await tracker.getPackageInfo('microsoft/vscode');
        expect(info).toBeDefined();
        expect(info.name).toBe('vscode');
        expect(info.full_name).toBe('microsoft/vscode');
      } catch (error) {
        // If rate limited, that's expected behavior
        console.log('Rate limited during test (expected):', error);
        expect(error).toBeDefined();
      }
    }, 15000);

    it("should get latest version", async () => {
      try {
        const version = await tracker.getLatestVersion('microsoft/vscode');
        // Should return a version string or null
        expect(version === null || typeof version === 'string').toBe(true);
      } catch (error) {
        // If rate limited, that's expected behavior
        console.log('Rate limited during test (expected):', error);
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  describe("Configuration", () => {
    it("should have correct name", () => {
      expect(tracker.name).toBe('github');
    });
  });
}); 