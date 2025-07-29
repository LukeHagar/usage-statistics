# Usage Statistics Tracker

A comprehensive GitHub Action for tracking download statistics across multiple platforms (NPM, GitHub, PyPI, Homebrew, PowerShell, Postman, Go) with configurable outputs and README integration.

## 🚀 Features

- 📊 **Multi-Platform Tracking**: NPM, GitHub, PyPI, Homebrew, PowerShell, Postman, Go
- 🎭 **Preview Mode**: Test with mock data without external API calls
- 📄 **Flexible Outputs**: JSON, CSV, and human-readable reports
- 📝 **README Integration**: Auto-update README with statistics
- ⚙️ **Configurable**: Custom configurations via JSON or preset modes
- 🔄 **GitHub Actions Ready**: Built for CI/CD workflows
- 🧪 **Comprehensive Testing**: Full test suite with Bun

## 📦 Installation

### As a GitHub Action

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
    go-modules: 'github.com/gin-gonic/gin,github.com/go-chi/chi'
    json-output-path: 'stats.json'
    csv-output-path: 'stats.csv'
    report-output-path: 'report.md'
    update-readme: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

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
| `go-modules` | Comma-separated list of Go modules | No | (empty) |
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
    go-modules: 'github.com/gin-gonic/gin,github.com/go-chi/chi'
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
        go-modules: 'github.com/gin-gonic/gin,github.com/go-chi/chi'
        json-output-path: 'stats.json'
        update-readme: 'true'
        github-token: ${{ secrets.GITHUB_TOKEN }}

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
    go-modules: 'github.com/gin-gonic/gin,github.com/go-chi/chi'
    json-output-path: 'data/stats.json'
    csv-output-path: 'data/stats.csv'
    report-output-path: 'docs/usage-report.md'
    update-readme: 'true'
    readme-path: 'README.md'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    postman-api-key: ${{ secrets.POSTMAN_API_KEY }}
    commit-message: 'feat: update usage statistics with detailed report'
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
    go-modules: 'github.com/gin-gonic/gin'
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
<!-- USAGE_STATS_START -->
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
<!-- USAGE_STATS_END -->
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
- **Go**: Module proxy statistics

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