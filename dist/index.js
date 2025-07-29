#!/usr/bin/env bun
// @bun

// src/index.ts
class UsageStatistics {
  data = [];
  addUsage(userId, action, metadata) {
    const record = {
      timestamp: new Date,
      userId,
      action,
      metadata
    };
    this.data.push(record);
  }
  getAllData() {
    return [...this.data];
  }
  getUserData(userId) {
    return this.data.filter((record) => record.userId === userId);
  }
  getActionData(action) {
    return this.data.filter((record) => record.action === action);
  }
  getStatistics() {
    if (this.data.length === 0) {
      return {
        totalRecords: 0,
        uniqueUsers: 0,
        uniqueActions: 0,
        timeRange: null
      };
    }
    const uniqueUsers = new Set(this.data.map((record) => record.userId)).size;
    const uniqueActions = new Set(this.data.map((record) => record.action)).size;
    const timestamps = this.data.map((record) => record.timestamp);
    const start = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const end = new Date(Math.max(...timestamps.map((t) => t.getTime())));
    return {
      totalRecords: this.data.length,
      uniqueUsers,
      uniqueActions,
      timeRange: { start, end }
    };
  }
}
async function main() {
  console.log(`\uD83D\uDE80 Usage Statistics Script Starting...
`);
  const stats = new UsageStatistics;
  stats.addUsage("user1", "login", { browser: "chrome" });
  stats.addUsage("user2", "login", { browser: "firefox" });
  stats.addUsage("user1", "view_page", { page: "/dashboard" });
  stats.addUsage("user3", "login", { browser: "safari" });
  stats.addUsage("user2", "logout");
  const summary = stats.getStatistics();
  console.log("\uD83D\uDCCA Usage Statistics Summary:");
  console.log(`Total Records: ${summary.totalRecords}`);
  console.log(`Unique Users: ${summary.uniqueUsers}`);
  console.log(`Unique Actions: ${summary.uniqueActions}`);
  if (summary.timeRange) {
    console.log(`Time Range: ${summary.timeRange.start.toISOString()} to ${summary.timeRange.end.toISOString()}`);
  }
  console.log(`
\uD83D\uDC65 User Data:`);
  const userData = stats.getUserData("user1");
  console.log(`User1 actions: ${userData.map((d) => d.action).join(", ")}`);
  console.log(`
\uD83C\uDFAF Action Data:`);
  const loginData = stats.getActionData("login");
  console.log(`Login events: ${loginData.length}`);
  console.log(`
\u2705 Script completed successfully!`);
}
if (import.meta.main) {
  main().catch(console.error);
}
export {
  UsageStatistics
};
