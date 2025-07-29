# Publishing to GitHub Marketplace

This guide walks you through the process of publishing the Usage Statistics Tracker to the GitHub Marketplace.

## Prerequisites

1. **GitHub Account**: You need a GitHub account with a verified email
2. **Repository**: This repository should be public
3. **GitHub Actions**: Actions must be enabled on your repository

## Step 1: Prepare Your Repository

### 1.1 Build the Action

```bash
# Install dependencies
bun install

# Build the action for distribution
bun run action:build

# Verify the build
ls -la dist/
```

### 1.2 Commit the Built Files

```bash
# Add the built files
git add dist/

# Commit with a descriptive message
git commit -m "build: add action distribution files for v1.0.0"

# Push to main branch
git push origin main
```

### 1.3 Create a Release

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Or create a release via GitHub UI:
# 1. Go to your repository
# 2. Click "Releases" on the right
# 3. Click "Create a new release"
# 4. Choose the tag v1.0.0
# 5. Add release notes
# 6. Publish release
```

## Step 2: Publish to Marketplace

### 2.1 Access the Publishing Interface

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. Look for a banner that says "Publish this Action to the GitHub Marketplace"
4. Click **Publish this Action**

### 2.2 Fill in Action Details

#### Basic Information
- **Action name**: `usage-statistics-tracker`
- **Description**: `Track download statistics across multiple platforms (NPM, GitHub, PyPI, Homebrew, PowerShell, Postman, Go)`
- **Repository**: `LukeHagar/usage-statistics`
- **Category**: Choose `Data` or `Utilities`
- **Icon**: Upload a relevant icon (512x512px PNG recommended)
- **Color**: Choose a brand color (e.g., `#0366d6` for blue)

#### Detailed Description
Use the content from the main README.md file, focusing on:
- Features and capabilities
- Usage examples
- Configuration options
- Supported platforms

#### Keywords
Add relevant keywords:
- `statistics`
- `analytics`
- `downloads`
- `npm`
- `github`
- `pypi`
- `homebrew`
- `powershell`
- `postman`
- `go`
- `tracking`
- `usage`

### 2.3 Marketplace Listing

#### Action Name
- **Marketplace name**: `Usage Statistics Tracker`
- **Description**: `Comprehensive GitHub Action for tracking download statistics across multiple platforms with configurable outputs and README integration`
- **Repository**: `LukeHagar/usage-statistics`

#### Categories
- **Primary category**: `Data`
- **Secondary category**: `Utilities`

#### Pricing
- **Pricing model**: Free
- **License**: MIT

## Step 3: Version Management

### 3.1 Semantic Versioning

Follow semantic versioning for releases:
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes

### 3.2 Release Process

For each new version:

```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Build the action
bun run action:build

# 4. Commit changes
git add .
git commit -m "feat: release v1.1.0"

# 5. Create and push tag
git tag v1.1.0
git push origin v1.1.0

# 6. Create GitHub release
# Go to GitHub and create a release for the new tag
```

### 3.3 Changelog

Maintain a `CHANGELOG.md` file:

```markdown
# Changelog

## [1.1.0] - 2025-01-XX
### Added
- New platform support for X
- Enhanced error handling
- Additional configuration options

### Changed
- Improved performance for large datasets
- Updated dependencies

### Fixed
- Bug fix for Y platform
- Resolved issue with Z feature

## [1.0.0] - 2025-01-XX
### Added
- Initial release
- Support for NPM, GitHub, PyPI, Homebrew, PowerShell, Postman, Go
- Configurable outputs (JSON, CSV, human-readable)
- README integration
- Preview mode
```

## Step 4: Marketing and Documentation

### 4.1 README Optimization

Ensure your README includes:
- Clear installation instructions
- Multiple usage examples
- Configuration documentation
- Troubleshooting section
- Contributing guidelines

### 4.2 Examples Repository

Consider creating a separate repository with examples:
- Basic usage workflows
- Advanced configurations
- Custom integrations
- Troubleshooting guides

### 4.3 Social Media

Promote your action on:
- GitHub Discussions
- Reddit (r/github, r/devops)
- Twitter/X with relevant hashtags
- LinkedIn for professional audience

## Step 5: Maintenance

### 5.1 Monitoring

- Monitor GitHub Issues for user feedback
- Track download statistics
- Respond to questions and bug reports
- Update documentation as needed

### 5.2 Updates

Regular maintenance tasks:
- Update dependencies
- Fix security vulnerabilities
- Add new platform support
- Improve performance
- Enhance documentation

### 5.3 Community Engagement

- Respond to issues promptly
- Help users with configuration
- Accept and review pull requests
- Maintain a welcoming community

## Troubleshooting

### Common Issues

1. **Action not found**: Ensure the action is properly built and tagged
2. **Build failures**: Check that all dependencies are included
3. **Permission issues**: Verify GitHub token permissions
4. **Rate limiting**: Implement proper rate limiting in the action

### Support

- GitHub Issues: For bug reports and feature requests
- GitHub Discussions: For questions and community support
- Documentation: Comprehensive README and examples

## Success Metrics

Track these metrics to measure success:
- **Downloads**: Number of action downloads
- **Stars**: Repository stars
- **Forks**: Repository forks
- **Issues**: User engagement and feedback
- **Usage**: Number of repositories using the action

## Legal Considerations

- **License**: MIT License (included)
- **Privacy**: No personal data collection
- **Terms of Service**: Follow GitHub's terms
- **Attribution**: Credit original authors if applicable

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Marketplace Guidelines](https://docs.github.com/en/developers/github-marketplace)
- [Action Metadata Syntax](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
- [Publishing Actions](https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace) 