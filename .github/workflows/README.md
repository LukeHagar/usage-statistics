# GitHub Action Testing Workflows

This directory contains multiple workflows for testing the Usage Statistics Tracker GitHub Action in different scenarios.

## Workflow Files

### 1. `test-action.yml` - Test Published Action
- **Purpose**: Tests the published version of the action from GitHub Marketplace
- **Action Reference**: `LukeHagar/usage-statistics@latest`
- **Use Case**: Verify that the published action works correctly for end users
- **Triggers**: Push to main, pull requests, manual dispatch

### 2. `test-action-dev.yml` - Test Development Action
- **Purpose**: Tests the development version of the action from the main branch
- **Action Reference**: `LukeHagar/usage-statistics@main`
- **Use Case**: Test changes before publishing a new version
- **Triggers**: Push to main, pull requests, manual dispatch

### 3. `test-action-local.yml` - Test Local Action Build
- **Purpose**: Tests the locally built action using `./` reference
- **Action Reference**: `./` (local action)
- **Use Case**: Test the action during development before pushing changes
- **Triggers**: Push to main, pull requests, manual dispatch

## Testing Scenarios

Each workflow tests the action in two modes:

### Preview Mode
- Uses `preview-mode: 'true'`
- Tests with mock data (no external API calls)
- Validates action outputs and file generation
- Expected behavior: No files should be generated in preview mode

### Real Data Mode
- Uses actual package names for testing
- Tests with real API calls to external services
- Validates JSON, CSV, and report file generation
- Tests multiple platforms: NPM, GitHub, PyPI, Homebrew, Go

## Test Packages Used

The workflows test with these sample packages:

- **NPM**: `lodash`, `axios`
- **GitHub**: `microsoft/vscode`
- **PyPI**: `requests`
- **Homebrew**: `git`
- **Go**: `github.com/go-chi/chi`

## Output Validation

Each workflow validates:

1. **File Generation**: Checks if expected files are created
2. **Action Outputs**: Validates action output variables
3. **JSON Structure**: Verifies JSON output format and structure
4. **CSV Format**: Checks CSV headers and data format
5. **Report Content**: Validates markdown report generation

## Usage

### For Development
Use `test-action-local.yml` to test your local changes:
```bash
# Make changes to your action
# Push to trigger the workflow
git push origin main
```

### For Pre-release Testing
Use `test-action-dev.yml` to test the main branch version:
```bash
# This runs automatically on push to main
# Or trigger manually via GitHub UI
```

### For Release Validation
Use `test-action.yml` to test the published version:
```bash
# This tests the actual published action
# Useful for validating releases
```

## Troubleshooting

### Action Not Found
If you get "Action not found" errors:
1. Ensure the action is properly built (`bun run action:build`)
2. Check that the action is published to GitHub Marketplace
3. Verify the latest version is available

### Build Failures
If builds fail:
1. Check that all dependencies are installed
2. Verify TypeScript compilation
3. Ensure the `dist/` directory is generated

### API Rate Limiting
If you encounter rate limiting:
1. The preview mode should work without API calls
2. Consider using GitHub tokens for authenticated requests
3. Implement proper rate limiting in the action

## Best Practices

1. **Always test locally first**: Use `test-action-local.yml` for initial testing
2. **Test before publishing**: Use `test-action-dev.yml` before creating releases
3. **Validate published versions**: Use `test-action.yml` to ensure releases work
4. **Monitor outputs**: Check all generated files and action outputs
5. **Handle errors gracefully**: The workflows include error handling for missing files

## Workflow Dependencies

- **Bun**: Used for building and testing
- **jq**: Used for JSON validation
- **GitHub Actions**: Required for running the workflows
- **Node.js**: Required for action execution (Node 20)

## Contributing

When adding new features to the action:

1. Update the local test workflow first
2. Test with real data to ensure API compatibility
3. Update the development workflow if needed
4. Test the published version after release 