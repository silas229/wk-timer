# Testing Setup

This project uses [Vitest](https://vitest.dev/) as the testing framework with React Testing Library for component testing.

## Prerequisites

- Node.js 20+
- pnpm 10.4.1+

## Test Structure

```
__tests__/
├── indexeddb.test.ts       # IndexedDB manager unit tests
├── team-context.test.tsx   # React context provider tests
├── timer.test.ts          # Timer functionality tests
└── utils.test.ts          # Utility function tests
```

## Available Scripts

### Root Level (Monorepo)

```bash
# Run all tests across the monorepo
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

### App Level (apps/web)

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

- Environment: jsdom (for DOM testing)
- Setup files: `vitest.setup.ts`
- Global test functions enabled
- Path aliases configured (@, @workspace/ui)
- Coverage with v8 provider

### Setup File (`vitest.setup.ts`)

- Jest DOM matchers
- IndexedDB mocking
- localStorage mocking
- IDBKeyRange mocking

## Mocking Strategy

### IndexedDB

The IndexedDB API is mocked in the setup file to provide:

- Mock database operations
- Consistent test environment
- No actual browser storage usage

### React Components

Components are tested using React Testing Library with:

- Render utilities
- User event simulation
- Async testing support
- Screen queries

## Test Categories

### Unit Tests

- **IndexedDB Manager**: Database operations, data validation
- **Utility Functions**: Time formatting, color validation, ID generation
- **Timer Logic**: Time calculations, state management

### Integration Tests

- **Team Context**: Provider functionality, state management
- **Component Interactions**: User events, state updates

### Coverage

Coverage is configured to track:

- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

Coverage reports are generated in multiple formats:

- Text (console output)
- HTML (browsable report)
- LCOV (CI integration)
- JSON (programmatic access)

## CI/CD Integration

### GitHub Actions

The project includes a GitHub Action (`.github/workflows/test.yml`) that:

- Runs on push to main/develop branches
- Runs on pull requests
- Executes linting, type checking, and tests
- Generates coverage reports
- Builds the project

### Workflow Steps

1. **Setup**: Checkout code, setup Node.js and pnpm
2. **Dependencies**: Install with frozen lockfile
3. **Quality Checks**: Linting and type checking
4. **Testing**: Run test suite
5. **Coverage**: Generate and upload coverage reports
6. **Build**: Verify project builds successfully

## Running Tests Locally

### Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test:run

# Run with coverage
pnpm test:coverage
```

### Watch Mode Development

```bash
# Start tests in watch mode
cd apps/web
pnpm test
```

### Coverage Reports

After running `pnpm test:coverage`, coverage reports are available:

- Text output in terminal
- HTML report in `coverage/index.html`
- LCOV file for CI integration

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolated Tests**: Each test should be independent
4. **Mock External Dependencies**: Mock APIs, databases, etc.

### Component Testing

1. **User-Centric**: Test from user perspective
2. **Async Handling**: Use waitFor for async operations
3. **Accessibility**: Test with screen reader queries
4. **State Management**: Test state changes and side effects

### Maintenance

1. **Update Dependencies**: Keep testing libraries current
2. **Review Coverage**: Aim for meaningful coverage
3. **Refactor Tests**: Keep tests maintainable
4. **Document Changes**: Update this README for changes

## Troubleshooting

### Common Issues

#### IndexedDB Not Available

If tests fail with IndexedDB errors, ensure the mock is properly configured in `vitest.setup.ts`.

#### React Testing Library Warnings

For "not wrapped in act()" warnings, wrap state updates in `act()` or use `waitFor()` for async operations.

#### Module Resolution

If imports fail, check the path aliases in `vitest.config.ts` match your project structure.

#### Coverage Issues

If coverage seems incorrect, check the exclude patterns in the Vitest configuration.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
