# Usage Statistics - Simplified Architecture

This document describes the new simplified architecture for the usage statistics tracker.

## 🏗️ Architecture Overview

The new system is organized into clear, modular components:

```
project-root/
├── collectors/           # Platform-specific data collectors
│   ├── types.ts         # Shared interfaces
│   ├── github.ts        # GitHub repository stats
│   ├── npm.ts           # NPM package stats
│   ├── pypi.ts          # PyPI package stats
│   ├── homebrew.ts      # Homebrew formula stats
│   ├── powershell.ts    # PowerShell module stats
│   └── [removed]
├── core/                # Core orchestration logic
│   ├── runner.ts        # Main collection orchestrator
│   ├── registry.ts      # Collector registry
│   ├── summarize.ts     # Markdown table generation
│   ├── update-readme.ts # README section replacement
│   ├── write-output.ts  # JSON file writing
│   └── utils.ts         # Shared utilities
├── config/
│   └── sources.json     # Configuration of what to track
├── output/              # Generated output files
├── scripts/
│   └── collect.ts       # Main collection script
└── .github/workflows/
    └── stats.yml        # GitHub Action workflow
```

## 🔧 Key Components

### 1. Collectors (`collectors/`)

Each collector is a simple function that takes a source name and returns a `MetricResult`:

```typescript
export interface MetricResult {
  platform: string;
  name: string;
  timestamp: string;
  metrics: Record<string, number | string | null>;
  error?: string;
}
```

### 2. Registry (`core/registry.ts`)

The registry manages all collectors and provides a unified interface:

```typescript
export const collectors = {
  github: { collect: collectGithubMetrics, batched: true },
  npm: { collect: collectNpmMetrics, batched: false },
  // ...
};
```

### 3. Runner (`core/runner.ts`)

The main orchestrator that:
- Loads sources from `config/sources.json`
- Groups sources by platform
- Handles batching for supported platforms
- Manages errors gracefully

### 4. Summarizer (`core/summarize.ts`)

Converts raw metrics into a human-readable markdown table for the README.

### 5. README Updater (`core/update-readme.ts`)

Replaces a marked section in the README with the generated statistics.

## 📊 Configuration

Sources are configured in `config/sources.json`:

```json
{
  "sources": [
    {
      "platform": "npm",
      "name": "express"
    },
    {
      "platform": "github",
      "name": "facebook/react"
    }
  ]
}
```

## 🚀 Usage

### Local Development

```bash
# Install dependencies
bun install

# Run collection
bun run collect

# Run collection and update README
bun run collect:readme
```

### GitHub Actions

The workflow in `.github/workflows/stats.yml` runs every Monday and:
1. Runs the collection script
2. Updates the README with new statistics
3. Commits and pushes the changes

## 📈 Adding New Platforms

To add a new platform:

1. Create a new collector in `collectors/`:
```typescript
export const collectNewPlatformMetrics: MetricCollector = {
  async collect(source: string): Promise<MetricResult> {
    // Implementation
  }
};
```

2. Register it in `core/registry.ts`:
```typescript
import { collectNewPlatformMetrics } from '../collectors/newplatform';

export const collectors = {
  // ... existing collectors
  newplatform: { collect: collectNewPlatformMetrics, batched: false }
};
```

3. Add sources to `config/sources.json`

## 🔄 Output Files

The system generates several output files in the `output/` directory:

- `latest.json` - Complete collection results
- `results.json` - Just the metrics array
- `summary.md` - Human-readable summary
- `backup-{timestamp}.json` - Timestamped backups

## 🎯 Benefits of the New Architecture

1. **Simplicity**: Each component has a single responsibility
2. **Reliability**: Graceful error handling and retries
3. **Extensibility**: Easy to add new platforms
4. **Maintainability**: Clear separation of concerns
5. **Testability**: Pure functions with clear interfaces

## 🔧 Environment Variables

- `GITHUB_TOKEN`: For GitHub API access (optional)
- `GITHUB_ACTIONS`: Set to 'true' in GitHub Actions context

## 📝 README Integration

The system looks for these markers in the README:

```markdown
<!-- {{UsageStats}} -->
[This section will be auto-updated]
<!-- {{endUsageStats}} -->
```

Everything between these markers will be replaced with the generated statistics table. 