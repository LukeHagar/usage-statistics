# Release Process

This repository has two release workflows to make publishing new versions easy and automated.

## 🚀 Release Workflows

### 1. Manual Release (`release.yml`)

**When to use**: When you want to manually control the release process and version bump.

**How to trigger**:
1. Go to the **Actions** tab in GitHub
2. Select **Release** workflow
3. Click **Run workflow**
4. Choose the version bump type:
   - `patch` - Bug fixes and minor changes (1.0.0 → 1.0.1)
   - `minor` - New features (1.0.0 → 1.1.0)
   - `major` - Breaking changes (1.0.0 → 2.0.0)

**What it does**:
- ✅ Installs dependencies and builds the action
- ✅ Bumps version in `package.json`
- ✅ Creates a new GitHub release with tag
- ✅ Uploads built assets to the release
- ✅ Commits version bump back to repository
- ✅ Updates test workflow to use new version

### 2. Automated Release (`auto-release.yml`)

**When to use**: For automatic releases on every push to main.

**How to trigger**: Push any commits to `main` branch.

**What it does**:
- ✅ Automatically creates a new patch release
- ✅ Bumps version in package.json
- ✅ Creates release with commit history
- ✅ Uploads built assets
- ✅ Tags and commits version bump

## 📦 Release Assets

Each release includes:
- `action.js` - Main action entry point
- `collectors.zip` - All collector modules
- `summaries.zip` - All summary modules  
- `utils.js` - Utility functions

## 🔄 Version Management

### Current Version
The current version is stored in `package.json` and follows [semantic versioning](https://semver.org/):
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Version Tags
Releases are tagged with `v` prefix:
- `v1.0.0`
- `v1.1.0`
- `v2.0.0`

### Action Usage
Users can reference specific versions:
```yaml
uses: LukeHagar/usage-statistics@v1.0.0  # Specific version
uses: LukeHagar/usage-statistics@v1      # Latest v1.x.x
uses: LukeHagar/usage-statistics@main    # Latest from main branch
```

## 🛠️ Development Workflow

### For Feature Development
1. Create feature branch
2. Make changes and commit
3. Push to main branch
4. Automated release will trigger automatically

### For Manual Releases
1. Make changes and commit
2. Go to Actions → Release
3. Choose version bump type
4. Run workflow

### For Quick Updates
1. Make changes and commit
2. Push to main branch
3. Automated release creates patch version

## 📋 Release Checklist

Before releasing:
- [ ] All tests pass
- [ ] Action builds successfully
- [ ] Native modules compile correctly
- [ ] README is up to date
- [ ] Version is appropriate for changes

After release:
- [ ] Verify release assets are uploaded
- [ ] Check that action works with new version
- [ ] Update documentation if needed
- [ ] Notify users of breaking changes (if any)

## 🚨 Breaking Changes

When making breaking changes:
1. Use `BREAKING CHANGE:` in commit message
2. Update README with migration guide
3. Consider creating a migration guide in release notes
4. Notify users through GitHub discussions or issues

## 📈 Release History

Check the [Releases page](https://github.com/LukeHagar/usage-statistics/releases) for:
- Complete release history
- Downloadable assets
- Release notes and changelog
- Migration guides for breaking changes
