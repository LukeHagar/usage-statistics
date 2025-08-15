# Usage Statistics Tracker

A comprehensive GitHub Action for tracking download statistics across multiple platforms (NPM, GitHub, PyPI, Homebrew, PowerShell) with configurable outputs and README integration.

## 🚀 Features

- 📊 **Multi-Platform Tracking**: NPM, GitHub, PyPI, Homebrew, PowerShell
- 🎭 **Preview Mode**: Test with mock data without external API calls
- 📄 **Flexible Outputs**: JSON, CSV, and human-readable reports
- 📝 **README Integration**: Auto-update README with statistics
- ⚙️ **Configurable**: Custom configurations via JSON or preset modes
- 🔄 **GitHub Actions Ready**: Built for CI/CD workflows
- 🧪 **Comprehensive Testing**: Full test suite with Bun
- 🐍 **Enhanced PyPI Integration**: Uses PyPI Stats API for comprehensive download statistics
- 📦 **Enhanced NPM Integration**: Bundle size analysis and dependency metrics
- 🐙 **Enhanced GitHub Integration**: Traffic insights and release downloads
- 💻 **Enhanced PowerShell Integration**: Module analytics and function counts
- 🔧 **Enhanced Go Integration**: Version analysis and GitHub integration

## 📦 Enhanced Platform Integrations

### 🐍 PyPI Statistics
Uses an external PyPI Stats API (via BigQuery replication) for comprehensive download statistics:
- **Download Metrics**: Monthly, weekly, daily download counts
- **Python Version Breakdown**: Downloads by Python version adoption
- **Platform Analysis**: Downloads by OS (Windows, Linux, macOS)
- **Trend Analysis**: Growth rates and time series data
- **API Integration**: Serves precomputed and on-demand results from a BigQuery-backed service

### 📦 NPM Statistics
Enhanced with bundle analysis and dependency metrics:
- **Download Statistics**: Daily, weekly, monthly, and yearly downloads
- **Bundle Analysis**: Bundle size, gzip size, dependency count
- **Dependency Metrics**: Total dependencies, dev dependencies, peer dependencies
- **Package Analytics**: Version count, package age, maintainer count

### 🐙 GitHub Statistics
Comprehensive repository analytics with traffic insights:
- **Repository Metrics**: Stars, forks, watchers, open issues
- **Traffic Analytics**: Views, unique visitors, clone statistics
- **Release Downloads**: Total and latest release download counts
- **Activity Metrics**: Repository age, last activity, release count

### 💻 PowerShell Statistics
Enhanced module analytics with detailed download tracking:
- **Download Metrics**: Total downloads across all versions with version-by-version breakdown
- **Version Analysis**: Latest version downloads, version count, release dates
- **Combined Charts**: Multi-module charts with different colors for each module
- **Time Series Data**: Downloads over time and cumulative download trends
- **Top Versions**: Bar charts showing top performing versions across all modules
- **Metadata**: Author, company, tags, package size, PowerShell version requirements

<!-- Go module tracking removed -->

## 📦 Installation

### PyPI Statistics Source

The PyPI collector now uses an external PyPI Stats API instead of querying BigQuery directly.

#### Option 1: Service Account (Recommended for GitHub Actions)

1. **Create a Google Cloud Project** (if you don't have one)
2. **Enable the BigQuery API** in your Google Cloud Console
3. **Create a Service Account**:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name like "pypi-stats-collector"
   - Grant "BigQuery User" role
4. **Create and download a JSON key**:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key" > "JSON"
   - Download the JSON file
5. **Add the service account key as a GitHub secret**:
   - In your GitHub repository, go to Settings > Secrets and variables > Actions
   - Create a new secret named `GOOGLE_CLOUD_CREDENTIALS`
   - Paste the entire contents of the downloaded JSON file

#### Option 2: Application Default Credentials (Local Development)

For local development, you can use Application Default Credentials:

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth application-default login
```

#### Environment Variables

- `PYPI_STATS_BASE_URL` (optional): Base URL for the PyPI Stats API. Default is `https://pypistats.dev`.

### As a GitHub Action

> **⚠️ Important**: This action requires native dependencies for chart generation. Run the setup command before using the action.
> 
> **What happens if you skip this step?** The action will fail with a `Cannot find module '../v8'` error when trying to generate charts. The setup command installs the system libraries needed to compile the native `skia-canvas` module.

**Quick Start:**
```yaml
- name: Install dependencies
  run: sudo apt-get update && sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev pkg-config python3 make g++ libstdc++6

- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios'
    github-repositories: 'microsoft/vscode,facebook/react'
    pypi-packages: 'requests,numpy'
    powershell-modules: 'PowerShellGet,PSReadLine'
    json-output-path: 'stats.json'
    update-readme: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Detailed Setup:**
```yaml
- name: Install system dependencies for skia-canvas
  run: |
    sudo apt-get update
    sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev pkg-config python3 make g++ libstdc++6

- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios'
    github-repositories: 'microsoft/vscode,facebook/react'
    pypi-packages: 'requests,numpy'
    powershell-modules: 'PowerShellGet,PSReadLine'
    json-output-path: 'stats.json'
    update-readme: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

#### Alternative: One-Line Setup

For convenience, you can use this one-liner to install all dependencies:

```yaml
- name: Install dependencies
  run: sudo apt-get update && sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev pkg-config python3 make g++ libstdc++6

- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios'
    github-repositories: 'microsoft/vscode,facebook/react'
    pypi-packages: 'requests,numpy'
    powershell-modules: 'PowerShellGet,PSReadLine'
    json-output-path: 'stats.json'
    update-readme: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

> **💡 Tip**: The one-liner is the same as the "Quick Start" example above - just a more compact format!

### Local Development

```bash
# Install dependencies
bun install

# Run the tracker
bun start

# Preview mode (no external API calls)
bun preview

# Run tests
bun test
```

<!-- {{UsageStats}} -->

## 📊 Usage Statistics

Last updated: 2025-07-31T16:09:10.951Z

**Summary:**
- **Total Sources**: 26
- **Platforms**: npm, github, pypi, powershell, go
- **Total Monthly Downloads**: 4640.4M
- **Total Stars**: 1103.1K
- **Total Forks**: 234.0K

## 📦 Package Statistics

| Platform | Name | Downloads (Monthly) | Downloads (Total) | Stars | Forks | Enhanced Metrics |
|---|---|---|---|---|---|---|
| NPM | express | 196.7M | 1884.3M | — | — | Bundle: 568.4KB, Age: 5327 days, Versions: 283 |
| NPM | react | 179.1M | 1632.6M | — | — | Bundle: 7.4KB, Age: 5026 days, Versions: 2423 |
| NPM | lodash | 347.7M | 3194.1M | — | — | Bundle: 69.8KB, Age: 4846 days, Versions: 114 |
| NPM | axios | 286.2M | 2968.9M | — | — | Bundle: 36.0KB, Age: 3988 days, Versions: 116 |
| NPM | moment | 108.3M | 1154.0M | — | — | Bundle: 294.9KB, Age: 5035 days, Versions: 76 |
| NPM | vue | 28.8M | 304.2M | — | — | Bundle: 126.0KB, Age: 4254 days, Versions: 538 |
| GitHub | facebook/react | — | — | 237.7K | 49.0K | Watchers: 237.7K, Releases: 30 |
| GitHub | microsoft/vscode | — | — | 175.2K | 34.1K | Watchers: 175.2K, Releases: 30 |
| GitHub | vercel/next.js | — | — | 133.5K | 29.0K | Watchers: 133.5K, Releases: 30 |
| GitHub | vuejs/vue | — | — | 209.2K | 33.7K | Watchers: 209.2K, Releases: 30 |
| GitHub | tensorflow/tensorflow | — | — | 191.0K | 74.8K | Watchers: 191.0K, Releases: 30 |
| PyPI | requests | 1423.9M | 716.0M | — | — | Python breakdown, Platform breakdown |
| PyPI | numpy | 899.7M | 451.0M | — | — | Python breakdown, Platform breakdown |
| PyPI | django | 48.9M | 24.5M | — | — | Python breakdown, Platform breakdown |
| PyPI | flask | 226.5M | 113.2M | — | — | Python breakdown, Platform breakdown |
| PyPI | pandas | 709.0M | 356.4M | — | — | Python breakdown, Platform breakdown |
| PyPI | matplotlib | 185.3M | 92.8M | — | — | Python breakdown, Platform breakdown |
| PowerShell | PowerShellGet | — | — | — | — | Versions: 81 |
| PowerShell | PSReadLine | — | — | — | — | Versions: 46 |
| PowerShell | Pester | — | — | — | — | Versions: 100 |
| PowerShell | PSScriptAnalyzer | — | — | — | — | Versions: 37 |
| PowerShell | dbatools | — | — | — | — | Versions: 100 |
<!-- Go rows removed -->



<!-- {{endUsageStats}} -->

## 🔧 Configuration

### Input Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `npm-packages` | Comma-separated list of NPM packages | No | (empty) |
| `github-repositories` | Comma-separated list of GitHub repos (owner/repo) | No | (empty) |
| `pypi-packages` | Comma-separated list of PyPI packages | No | (empty) |
| `homebrew-formulas` | Comma-separated list of Homebrew formulas | No | (empty) |
| `powershell-modules` | Comma-separated list of PowerShell modules | No | (empty) |
| `postman-collections` | Comma-separated list of Postman collection IDs | No | (empty) |
<!-- go-modules input removed -->
| `json-output-path` | Path for JSON output | No | `stats.json` |
| `csv-output-path` | Path for CSV output | No | (empty) |
| `report-output-path` | Path for human-readable report | No | (empty) |
| `update-readme` | Whether to update README | No | `true` |
| `readme-path` | Path to README file | No | `README.md` |
| `github-token` | GitHub token for API access | No | `${{ github.token }}` |
| `postman-api-key` | Postman API key | No | (empty) |
| `commit-message` | Commit message for changes | No | `chore: update usage statistics [skip ci]` |
| `preview-mode` | Run with mock data | No | `false` |

### Configuration Examples

#### NPM Packages Only
```yaml
- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios,react'
```

#### GitHub Repositories Only
```yaml
- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    github-repositories: 'microsoft/vscode,facebook/react,vercel/next.js'
```

#### Mixed Platform Configuration
```yaml
- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios'
    github-repositories: 'microsoft/vscode,facebook/react'
    pypi-packages: 'requests,numpy'
    homebrew-formulas: 'git,node'
    powershell-modules: 'PowerShellGet,PSReadLine'
    postman-collections: '12345,67890'
    # go-modules removed
  # env:
  #   PYPI_STATS_BASE_URL: https://your-host
```

### Outputs

| Output | Description |
|--------|-------------|
| `json-output` | Path to the generated JSON file |
| `csv-output` | Path to the generated CSV file |
| `report-output` | Path to the generated report file |
| `total-downloads` | Total downloads across all platforms |
| `unique-packages` | Number of unique packages tracked |
| `platforms-tracked` | Comma-separated list of platforms tracked |

## 📋 Usage Examples

### Basic Usage

```yaml
name: Update Usage Statistics

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:

jobs:
  update-stats:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Usage Statistics Tracker
      uses: LukeHagar/usage-statistics@v1
      with:
        npm-packages: 'lodash,axios'
        github-repositories: 'microsoft/vscode,facebook/react'
        pypi-packages: 'requests,numpy'
        homebrew-formulas: 'git,node'
        powershell-modules: 'PowerShellGet,PSReadLine'
        postman-collections: '12345,67890'
        # go-modules removed
        json-output-path: 'stats.json'
        update-readme: 'true'
        github-token: ${{ secrets.GITHUB_TOKEN }}
      env:
        GOOGLE_CLOUD_CREDENTIALS: ${{ secrets.GOOGLE_CLOUD_CREDENTIALS }}

    - name: Commit and push changes
      run: |
        git config user.name "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"
        git add stats.json README.md
        git commit -m "chore: update usage statistics [skip ci]" || echo "No changes to commit"
        git push
```

### Advanced Usage with Multiple Outputs

```yaml
- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios,react'
    github-repositories: 'microsoft/vscode,facebook/react'
    pypi-packages: 'requests,numpy'
    homebrew-formulas: 'git,node'
    powershell-modules: 'PowerShellGet,PSReadLine'
    postman-collections: '12345,67890'
    # go-modules removed
    json-output-path: 'data/stats.json'
    csv-output-path: 'data/stats.csv'
    report-output-path: 'docs/usage-report.md'
    update-readme: 'true'
    readme-path: 'README.md'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    postman-api-key: ${{ secrets.POSTMAN_API_KEY }}
    commit-message: 'feat: update usage statistics with detailed report'
  env:
    GOOGLE_CLOUD_CREDENTIALS: ${{ secrets.GOOGLE_CLOUD_CREDENTIALS }}
```

### Preview Mode for Testing

```yaml
- name: Test Usage Statistics
  uses: LukeHagar/usage-statistics@v1
  with:
    preview-mode: 'true'
    json-output-path: 'test-stats.json'
    csv-output-path: 'test-stats.csv'
    report-output-path: 'test-report.md'
    update-readme: 'false'
```

### Using Outputs in Subsequent Steps

```yaml
- name: Usage Statistics Tracker
  id: stats
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios'
    github-repositories: 'microsoft/vscode,facebook/react'
    powershell-modules: 'PowerShellGet'
    postman-collections: '12345'
    # go-modules removed
    json-output-path: 'stats.json'

- name: Use Statistics Data
  run: |
    echo "Total downloads: ${{ steps.stats.outputs.total-downloads }}"
    echo "Unique packages: ${{ steps.stats.outputs.unique-packages }}"
    echo "Platforms: ${{ steps.stats.outputs.platforms-tracked }}"
    echo "JSON file: ${{ steps.stats.outputs.json-output }}"
```

## 📊 README Integration

To enable automatic README updates, add these markers to your README.md:

```markdown
<!-- METRICS_START -->
## 📊 Usage Statistics

Last updated: 2025-07-29T18:53:52.619Z

### Summary
- **Total Downloads**: 414,533
- **Unique Packages**: 8
- **Platforms Tracked**: npm, pypi, homebrew, go

### Platform Totals
- **HOMEBREW**: 380,163 downloads (2 packages)
- **NPM**: 34,311 downloads (2 packages)
- **GO**: 33 downloads (2 packages)

### Top Packages
1. **node** (homebrew) - 226,882 downloads
2. **git** (homebrew) - 153,281 downloads
3. **axios** (npm) - 18,397 downloads
4. **lodash** (npm) - 15,914 downloads
5. **github.com/go-chi/chi** (go) - 33 downloads
<!-- METRICS_END -->
```

## 🔧 Development

### Prerequisites

- [Bun](https://bun.sh/) (version 1.0.0 or higher)

### Local Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Run tests
bun test

# Build the action
bun run action:build

# Test the action locally
bun run action:test
```

### Project Structure

```
usage-statistics/
├── src/
│   ├── index.ts          # Main library entry point
│   ├── action.ts         # GitHub Action entry point
│   ├── aggregator.ts     # Statistics aggregation
│   ├── types/            # TypeScript type definitions
│   ├── trackers/         # Platform-specific trackers
│   └── utils/            # Utility functions
├── .github/
│   └── workflows/        # GitHub Actions workflows
├── action.yml            # Action metadata
├── package.json          # Project configuration
└── README.md            # This file
```

## 🚀 Publishing to GitHub Marketplace

### 1. Prepare Your Repository

1. **Create a release tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Build the action**:
   ```bash
   bun run action:build
   ```

3. **Commit the built files**:
   ```bash
   git add dist/
   git commit -m "build: add action distribution files"
   git push
   ```

### 2. Publish to Marketplace

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. Click **Publish this Action to the GitHub Marketplace**
4. Fill in the required information:
   - **Action name**: `usage-statistics-tracker`
   - **Description**: `Track download statistics across multiple platforms`
   - **Category**: `Data` or `Utilities`
   - **Icon**: Upload an appropriate icon
   - **Color**: Choose a brand color
   - **README**: Use the content from this README

### 3. Version Management

For each new version:

```bash
# Update version in package.json
# Build the action
bun run action:build

# Create and push a new tag
git tag v1.1.0
git push origin v1.1.0
```

## 📈 Supported Platforms

- **NPM**: Package download statistics
- **GitHub**: Release download statistics
- **PyPI**: Python package downloads
- **Homebrew**: Formula installation statistics
- **PowerShell**: Module download statistics
- **Postman**: Collection fork/download statistics
<!-- Go platform removed -->

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/) for fast TypeScript execution
- Uses [Octokit](https://github.com/octokit/octokit.js) for GitHub API integration
- Inspired by the need for comprehensive usage analytics across multiple platforms