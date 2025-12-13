# Wettkämpfe Timer

[![Deployment](https://github.com/silas229/wk-timer/actions/workflows/deploy.yml/badge.svg)](https://wk-timer.us.silas229.name/)
[![Tests](https://github.com/silas229/wk-timer/actions/workflows/test.yml/badge.svg)](https://github.com/silas229/wk-timer/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/silas229/wk-timer)](https://app.codecov.io/gh/silas229/wk-timer/)

A web-based timer application built with modern technologies for precise time tracking and team management made for **B-Teil of Bundeswettbewerb der Deutschen Jugendfeuerwehr**. This is a **Vibe Code Project** focusing on clean architecture, excellent developer experience, and robust testing practices.

## ✨ Features

### 🏃‍♂️ **Timer Functionality**

- **Precision Timing**: High-accuracy stopwatch with millisecond precision
- **Competition Activities**: Specialized for German Fire Department B-Teil format with meaningful activity names
- **Lap Recording**: Track up to 12 laps per session with individual timestamps
- **Auto-completion**: Automatic round completion after 12 laps
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

### 🔗 **Sharing & Embedding**

- **Round Sharing**: Share completed rounds with unique URLs
- **Custom Descriptions**: Add descriptions to shared rounds for context
- **Copy & Native Share**: Copy links or use native OS share dialog
- **oEmbed Support**: Rich embeds in social media and platforms
- **Embed Pages**: Dedicated embed URLs for iframe integration
- **Social Metadata**: Open Graph and Twitter Card support for rich previews

### 🎨 **User Experience**

- **Dark/Light Mode**: System-aware theme switching
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live timer display with smooth animations
- **Activity-Based Interface**: Intuitive German competition activity display
- **Current Activity Highlighting**: Visual indication of ongoing activity with live timing
- **Auto-Scrolling**: Smart scrolling to keep current activity visible
- **Fixed Layout**: Stable button positioning prevents UI jumping
- **Intuitive Navigation**: Clean, modern interface with clear visual hierarchy

### 📱 **Progressive Web App (PWA)**

- **Offline Functionality**: Timer works without internet connection
- **App-like Experience**: Install as native app on any device
- **Service Worker**: Background caching for instant loading
- **Install Prompts**: Smart installation suggestions
- **Network Status**: Visual indicator for online/offline state
- **Manifest Configuration**: Proper app metadata and icons
- **Cross-Platform**: Works on desktop, mobile, and tablet

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

### **Progressive Web App**

- **next-pwa** - Service worker and PWA functionality
- **Workbox** - Offline caching strategies
- **Web App Manifest** - Native app-like installation

### **Data Management**

- **IndexedDB** - Browser database for large-scale data storage
- **React Context** - State management for teams and settings
- **Custom Hooks** - Reusable logic abstraction

### **Development & Quality**

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **npm** - Fast, reliable package manager
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking

### **Architecture**

- **Single Package Structure** - Simplified project organization
- **Component Library** - Reusable UI components with shadcn/ui
- **Path Aliases** - Clean import statements
- **CI/CD Integration** - GitHub Actions for automated testing

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10 (included with Node.js)

### Installation

#### Installation and Setup

```bash
# Clone the repository
git clone <repository-url>
cd wk-timer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

The application uses environment variables for configuration. Copy the example file and customize as needed:

```bash
# Copy the example environment file
cp .env.example .env
```

Available environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BASE_URL` | Base URL for sharing and embed features | `http://localhost:3000` | No |
| `PORT` | Port for the development server | `3000` | No |
| `ROUNDS_STORAGE_DIR` | Directory for storing shared rounds | `./data/rounds` | No |

#### Production Configuration

For production deployment, ensure to set:

```bash
# Production example
BASE_URL=https://your-domain.com
ROUNDS_STORAGE_DIR=./data/rounds
```

**Note**: The `.env` file is already included in `.gitignore` to prevent committing sensitive data.

### PWA Installation

Once the app is running, you can install it as a Progressive Web App:

1. **Desktop (Chrome/Edge)**: Click the install icon in the address bar
2. **Mobile (iOS Safari)**: Tap Share → Add to Home Screen
3. **Mobile (Chrome/Firefox)**: Tap the menu → Install App
4. **In-app prompt**: Use the floating install button when available

The installed PWA will work offline and provide a native app experience.

### Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking
npm run format           # Format code with Prettier

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once (CI mode)
npm run test:ui          # Interactive test interface
npm run test:coverage    # Generate coverage reports
```

## 🧪 Testing

This project includes comprehensive testing with **35+ tests** across 6 test files:

- **Unit Tests**: Core functionality and utilities
- **Component Tests**: React component behavior
- **Integration Tests**: IndexedDB operations and data flow
- **Activity Tests**: German Fire Department competition activity logic
- **Current Activity Tests**: Real-time activity tracking functionality
- **Coverage Reports**: Detailed code coverage analysis

For detailed testing information, see **[TESTING.md](./TESTING.md)**

### Quick Testing Commands

```bash
# Run all tests
npm run test:run

# Watch mode for development
npm run test

# Coverage analysis
npm run test:coverage

# Interactive test UI
npm run test:ui
```

## 📁 Project Structure

```text
wk-timer/
├── app/                   # Next.js App Router pages
├── components/            # React components
│   └── ui/               # shadcn/ui component library
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and IndexedDB manager
├── public/               # Static assets and PWA files
├── __tests__/            # Test files
└── .github/
    └── workflows/        # CI/CD pipelines
```

## 🏗️ Architecture Highlights

### **Activity-Based Timer System**

- **Activity Mapping**: Converts raw lap times into German Fire Department activities
- **Real-time Calculations**: Live activity time calculations with millisecond precision
- **Dynamic UI Updates**: Current activity highlighting with auto-scrolling
- **Type-safe Configuration**: Strongly typed activity definitions and calculations

### **IndexedDB Integration**

- Custom database manager with transaction safety
- Automatic data migration from localStorage
- Optimized queries with proper indexing
- Non-blocking operations for smooth UI

### **Component Architecture**

- Context-based state management
- Custom hooks for business logic
- Activity-aware UI components with German localization
- Separation of concerns between UI and data
- Type-safe prop interfaces

### **Progressive Web App Features**

- **Service Worker Integration**: Automatic caching with Workbox strategies
- **Offline Functionality**: Full timer functionality without internet
- **App Installation**: Native app-like installation across platforms
- **Background Updates**: Automatic content updates when online
- **Network Detection**: Smart online/offline status management
- **Manifest Configuration**: Proper app metadata for installation prompts

### **Testing Strategy**

- Comprehensive mocking for external dependencies
- Activity calculation testing with edge cases
- Integration testing for critical user flows
- Current activity logic validation
- Coverage tracking and reporting
- CI/CD integration for quality gates

## 🔧 Adding Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add <component-name>
```

Components are automatically placed in `components/ui/` and can be imported:

```tsx
import { Button } from "@/components/ui/button"
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test:run`
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
