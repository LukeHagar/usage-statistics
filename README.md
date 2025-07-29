# Usage Statistics

A Bun TypeScript script project for analyzing usage statistics with a clean, modern architecture.

## Features

- 🚀 **Fast Execution**: Built with Bun for lightning-fast TypeScript execution
- 📊 **Usage Analytics**: Track user actions and generate statistics
- 🧪 **Comprehensive Testing**: Full test suite with Bun's built-in test runner
- 📦 **Modern Tooling**: TypeScript, ES modules, and modern JavaScript features
- 🔧 **Developer Friendly**: Hot reloading, watch mode, and excellent DX

## Prerequisites

- [Bun](https://bun.sh/) (version 1.0.0 or higher)

## Installation

```bash
# Install dependencies
bun install
```

## Usage

### Running the Script

```bash
# Run the main script
bun start

# Preview the report with mock data (no external API calls)
bun preview

# Run in development mode with hot reloading
bun run dev

# Run directly with bun
bun run src/index.ts
```

### Preview Mode

The preview mode allows you to see how the report will look without making any external API calls or writing files:

```bash
# Generate a preview report with mock data
bun preview

# Or use the long flag
bun start --preview
```

This is useful for:
- Testing the report format
- Demonstrating the functionality
- Development and debugging
- CI/CD testing without external dependencies

### Building

```bash
# Build the project
bun run build
```

### Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

## Project Structure

```
usage-statistics/
├── src/
│   ├── index.ts          # Main entry point
│   ├── index.test.ts     # Test suite
│   └── test-setup.ts     # Test configuration
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── bunfig.toml          # Bun configuration
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## API Reference

### UsageStatistics Class

The main class for tracking and analyzing usage data.

#### Methods

- `addUsage(userId: string, action: string, metadata?: Record<string, any>)`: Add a new usage record
- `getAllData()`: Get all usage data
- `getUserData(userId: string)`: Get usage data for a specific user
- `getActionData(action: string)`: Get usage data for a specific action
- `getStatistics()`: Get comprehensive statistics summary

#### Example Usage

```typescript
import { UsageStatistics } from './src/index';

const stats = new UsageStatistics();

// Add usage data
stats.addUsage("user1", "login", { browser: "chrome" });
stats.addUsage("user2", "logout");

// Get statistics
const summary = stats.getStatistics();
console.log(`Total records: ${summary.totalRecords}`);
```

## Development

### Scripts

- `bun start`: Run the main script
- `bun run dev`: Run in development mode with file watching
- `bun run build`: Build the project for production
- `bun test`: Run the test suite

### Adding Dependencies

```bash
# Add a production dependency
bun add <package-name>

# Add a development dependency
bun add -d <package-name>
```

## GitHub Actions Integration

This project includes a GitHub Actions workflow that automatically updates usage statistics and commits the results to the repository.

### Setup

1. **Enable the workflow**: The workflow file is located at `.github/workflows/update-stats.yml`
2. **Configure your packages**: Update `src/config.ts` with your actual package names
3. **Set up environment variables** (if needed):
   - `GITHUB_TOKEN`: Automatically provided by GitHub Actions
   - `POSTMAN_API_KEY`: If tracking Postman collections

### Workflow Features

- **Scheduled runs**: Updates stats daily at 2 AM UTC
- **Manual triggering**: Can be run manually via GitHub Actions UI
- **Rate limiting**: Built-in rate limiting to avoid API abuse
- **Auto-commit**: Automatically commits `stats.json` and updates README
- **Error handling**: Graceful handling of API failures

### Customization

Edit `src/config.ts` to track your specific packages:

```typescript
export const defaultConfig: TrackingConfig = {
  npmPackages: ['your-package-name'],
  githubRepos: ['your-org/your-repo'],
  // ... other platforms
};
```

### Manual Execution

Run locally with GitHub Action mode:

```bash
GITHUB_TOKEN=your_token bun run src/index.ts --action
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).