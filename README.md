# Wettkämpfe Timer

[![Tests](https://github.com/silas229/wk-timer/actions/workflows/test.yml/badge.svg)](https://github.com/silas229/wk-timer/actions/workflows/test.yml)

A web-based timer application built with modern technologies for precise time tracking and team management made for **B-Teil of Bundeswettbewerb der Deutschen Jugendfeuerwehr**. This is a **Vibe Code Project** focusing on clean architecture, excellent developer experience, and robust testing practices.

## ✨ Features

### 🏃‍♂️ **Timer Functionality**

- **Precision Timing**: High-accuracy stopwatch with millisecond precision
- **Lap Recording**: Track up to 13 laps per session with individual timestamps
- **Auto-completion**: Automatic round completion after 13 laps
- **State Management**: Start, stop, lap, and restart functionality

### 👥 **Team Management**

- **Multiple Teams**: Create and manage unlimited teams
- **Team Colors**: Visual team identification with 8 predefined colors
- **Team Selection**: Easy switching between active teams
- **Cascade Deletion**: Automatic cleanup of team data when teams are deleted

### 📊 **Data Persistence**

- **IndexedDB Storage**: High-performance local database for large datasets
- **Automatic Migration**: Seamless upgrade from localStorage to IndexedDB
- **Round History**: Complete history of all timed sessions
- **Data Integrity**: Transaction-safe operations with error handling

### 🎨 **User Experience**

- **Dark/Light Mode**: System-aware theme switching
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live timer display with smooth animations
- **Intuitive Navigation**: Clean, modern interface with clear visual hierarchy

## 🛠️ Technologies Used

### **Frontend Framework**

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development

### **UI & Styling**

- **shadcn/ui** - High-quality React components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme management

### **Data Management**

- **IndexedDB** - Browser database for large-scale data storage
- **React Context** - State management for teams and settings
- **Custom Hooks** - Reusable logic abstraction

### **Development & Quality**

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Turbo** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking

### **Architecture**

- **Monorepo Structure** - Organized workspace with shared packages
- **Component Library** - Reusable UI components package
- **Path Aliases** - Clean import statements
- **CI/CD Integration** - GitHub Actions for automated testing

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.4.1

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wkt-next

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Development Commands

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once (CI mode)
pnpm test:ui          # Interactive test interface
pnpm test:coverage    # Generate coverage reports
```

## 🧪 Testing

This project includes comprehensive testing with **30 tests** across 4 test files:

- **Unit Tests**: Core functionality and utilities
- **Component Tests**: React component behavior
- **Integration Tests**: IndexedDB operations and data flow
- **Coverage Reports**: Detailed code coverage analysis

For detailed testing information, see **[TESTING.md](./TESTING.md)**

### Quick Testing Commands

```bash
# Run all tests
pnpm test:run

# Watch mode for development
pnpm test

# Coverage analysis
pnpm test:coverage

# Interactive test UI
pnpm test:ui
```

## 📁 Project Structure

```
wkt-next/
├── apps/
│   └── web/               # Main application
│       ├── app/           # Next.js App Router pages
│       ├── components/    # React components
│       ├── lib/           # Utilities and IndexedDB manager
│       └── __tests__/     # Test files
├── packages/
│   ├── ui/                # Shared UI component library
│   ├── eslint-config/     # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
└── .github/
    └── workflows/         # CI/CD pipelines
```

## 🏗️ Architecture Highlights

### **IndexedDB Integration**

- Custom database manager with transaction safety
- Automatic data migration from localStorage
- Optimized queries with proper indexing
- Non-blocking operations for smooth UI

### **Component Architecture**

- Context-based state management
- Custom hooks for business logic
- Separation of concerns between UI and data
- Type-safe prop interfaces

### **Testing Strategy**

- Comprehensive mocking for external dependencies
- Integration testing for critical user flows
- Coverage tracking and reporting
- CI/CD integration for quality gates

## 🔧 Adding Components

To add new shadcn/ui components:

```bash
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

Components are automatically placed in `packages/ui/src/components` and can be imported:

```tsx
import { Button } from "@workspace/ui/components/button"
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm test:run`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Vibe Code Project

This is a **Vibe Code Project** emphasizing:

- **Clean Architecture** - Well-organized, maintainable code structure
- **Developer Experience** - Excellent tooling and development workflow
- **Quality Assurance** - Comprehensive testing and automated quality checks
- **Modern Stack** - Latest technologies and best practices
- **Performance** - Optimized for speed and efficiency
