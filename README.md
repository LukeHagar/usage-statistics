# Usage Statistics Tracker

A GitHub Action that tracks download statistics across multiple platforms (NPM, GitHub, PyPI, PowerShell) and generates beautiful charts and reports.

## 🚀 Features

- 📊 **Multi-Platform Tracking**: NPM, GitHub, PyPI, PowerShell
- 📈 **Beautiful Charts**: Automatic chart generation with Chart.js
- 📝 **README Integration**: Auto-update README with statistics
- 📄 **JSON Output**: Structured data for further processing
- 🔄 **GitHub Actions Ready**: Built for CI/CD workflows

## 📦 Supported Platforms

### 🐍 PyPI (Python)
- Download statistics (daily, weekly, monthly)
- Python version breakdown
- Platform analysis (Windows, Linux, macOS)
- Installer analysis (pip, conda, etc.)

### 📦 NPM (JavaScript/TypeScript)
- Download statistics (daily, weekly, monthly, yearly)
- Package metadata and version information

### 🐙 GitHub
- Repository statistics (stars, forks, watchers)
- Release download counts
- Issue tracking

### 💻 PowerShell
- Module download statistics
- Version analysis
- Metadata (author, description, etc.)

## 🚀 Quick Start

> **⚠️ Important**: This action requires native dependencies for chart generation. Run the setup command before using the action.

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

## 📋 Configuration

### Input Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `npm-packages` | Comma-separated list of NPM packages | No | (empty) |
| `github-repositories` | Comma-separated list of GitHub repos (owner/repo) | No | (empty) |
| `pypi-packages` | Comma-separated list of PyPI packages | No | (empty) |
| `powershell-modules` | Comma-separated list of PowerShell modules | No | (empty) |
| `json-output-path` | Path for JSON output | No | `stats.json` |
| `update-readme` | Whether to update README | No | `true` |
| `readme-path` | Path to README file | No | `README.md` |
| `github-token` | GitHub token for API access | No | `${{ github.token }}` |
| `commit-message` | Commit message for changes | No | `chore: update usage statistics` |

### Examples

#### Track NPM packages only
```yaml
- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios,react'
    update-readme: 'true'
```

#### Track multiple platforms
```yaml
- name: Usage Statistics Tracker
  uses: LukeHagar/usage-statistics@v1
  with:
    npm-packages: 'lodash,axios'
    github-repositories: 'microsoft/vscode,facebook/react'
    pypi-packages: 'requests,numpy'
    powershell-modules: 'PowerShellGet,PSReadLine'
    json-output-path: 'data/stats.json'
    update-readme: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## 📊 README Integration

Add these markers to your README.md to enable automatic updates:

```markdown
<!-- METRICS_START -->
## 📊 Usage Statistics

Last updated: 2025-08-15T02:53:12.152Z

### Summary
- **Total Downloads**: 414,533
- **Unique Packages**: 8
- **Platforms Tracked**: npm, pypi, powershell

### Platform Totals
- **NPM**: 34,311 downloads (2 packages)
- **PyPI**: 380,163 downloads (2 packages)
- **PowerShell**: 33 downloads (2 packages)

### Top Packages
1. **requests** (pypi) - 226,882 downloads
2. **numpy** (pypi) - 153,281 downloads
3. **axios** (npm) - 18,397 downloads
4. **lodash** (npm) - 15,914 downloads
<!-- METRICS_END -->
```

## 🔧 Complete Workflow Example

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

    - name: Commit and push changes
      run: |
        git config user.name "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"
        git add stats.json README.md
        git commit -m "chore: update usage statistics" || echo "No changes to commit"
        git push
```

## 🛠️ Local Development

```bash
# Install dependencies
bun install

# Run the tracker
bun --env-file=.dev.env run src/action.ts

# Build the action
bun run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.