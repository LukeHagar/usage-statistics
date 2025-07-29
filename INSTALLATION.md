# Quick Installation Guide

## 🚀 Install the Usage Statistics Tracker

### Basic Installation

Add this to your GitHub Actions workflow:

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
    update-readme: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Complete Example Workflow

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
        csv-output-path: 'stats.csv'
        report-output-path: 'docs/usage-report.md'
        update-readme: 'true'
        github-token: ${{ secrets.GITHUB_TOKEN }}

    - name: Commit and push changes
      run: |
        git config user.name "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"
        git add stats.json stats.csv docs/usage-report.md README.md
        git commit -m "chore: update usage statistics [skip ci]" || echo "No changes to commit"
        git push
```

### README Integration

Add these markers to your README.md for automatic updates:

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

## 📚 Documentation

- **Full Documentation**: [README.md](README.md)
- **Examples**: [examples/basic-usage.yml](examples/basic-usage.yml)
- **Repository**: [https://github.com/LukeHagar/usage-statistics](https://github.com/LukeHagar/usage-statistics)

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/LukeHagar/usage-statistics/issues)
- **Discussions**: [GitHub Discussions](https://github.com/LukeHagar/usage-statistics/discussions)
- **Documentation**: [README.md](README.md) 