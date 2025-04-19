# Royal Blackjack Casino - System Architecture

## Overview

Royal Blackjack Casino is a modern web application built with Next.js, React, and TypeScript. The application provides an interactive casino experience with a focus on blackjack gameplay, user authentication, and game statistics tracking.

## Architecture Principles

The application follows these key architectural principles:

1. **Service-Oriented Architecture**: Core functionality is abstracted into services with well-defined interfaces
2. **Dependency Injection**: Services can depend on other services, with dependencies resolved at runtime
3. **Singleton Pattern**: Services are implemented as singletons to ensure consistent state
4. **React Hooks Pattern**: Custom hooks encapsulate reusable UI logic and state management
5. **Clean Architecture**: Clear separation between domain logic, application logic, and presentation layer

## High-Level Architecture

The application is structured into several key layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Components │  │   Layouts   │  │        Pages        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                        Application Layer                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Hooks    │  │   Contexts  │  │      Utilities      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                         Domain Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Services  │  │    Store    │  │       Domains       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Infrastructure Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Client │  │   Storage   │  │      Analytics      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Service Layer

The service layer is the backbone of the application, providing a centralized way to access functionality across the app.

#### Service Registry

The `ServiceManager` (in `src/services/serviceRegistry.ts`) is a central registry that manages the lifecycle of all services. It:

- Handles service registration and dependency resolution
- Ensures services are initialized in the correct order
- Provides a singleton instance of each service
- Manages service configuration

Services are registered with:
- A unique name
- The service class
- Optional configuration parameters
- Optional dependencies (other services it depends on)

```typescript
// Example of service registration
serviceManager.register('auth', AuthService);
serviceManager.register('game', GameService, {}, ['auth']);
```

#### Service Interface

All services implement the `ServiceInterface` (in `src/services/serviceInterface.ts`), which defines:

- `initialize()`: Set up the service
- `isInitialized()`: Check if the service is ready
- `reset()`: Clean up and return to initial state

Most services extend the `BaseService` abstract class, which provides:

- Common error handling
- Retry mechanisms
- Timeout handling
- Logging functionality

### 2. State Management

The application uses a combination of:

- **React Context**: For UI-related state shared across components
- **Custom Hooks**: For component-specific state and logic
- **Service State**: For persistent application state

Key state management patterns include:

- **useStateWithSafeUpdates**: A custom hook that prevents infinite update loops
- **Service state persistence**: Services maintain their own state and provide methods to access it

### 3. API Layer

The API layer handles communication with backend services:

- `httpClient.ts`: Provides a unified interface for making HTTP requests
- API-specific services (e.g., `authService.ts`, `gameService.ts`)

These services handle:
- Authentication
- Data fetching and updating
- Error handling and retries
- Request/response transformation

### 4. Game Logic

Game-specific logic is organized into domain-specific hooks and services:

- Game state management
- Game rules implementation
- Game UI interactions

#### Dealer Logic

The dealer logic is implemented with a clear separation between pure game logic and UI rendering:

- `dealerLogic.ts`: Contains pure business logic for dealer actions
  - `computeDealerMoves`: Returns a sequence of dealer moves (reveal, hit, stand) with state snapshots
  - `shouldDealerHit`: Determines whether the dealer should hit based on hand and rules
  - `isSoft17`: Checks if the dealer's hand is a soft 17

- `DealerTurn.tsx`: UI component that:
  - Uses the pure business logic from `dealerLogic.ts`
  - Renders the sequence of dealer moves with appropriate animations and delays
  - Maintains UI-specific state for visual feedback

This separation ensures:
- Business logic remains testable and pure
- UI rendering concerns are isolated from game rules
- Easier maintenance and updates to either logic or UI
- Consistent behavior across different UI implementations

### 5. Storage Layer

The application includes multiple storage mechanisms:

- `LocalStorageService`: For persistent client-side storage
- `IndexedDBService`: For larger client-side data storage

### 6. Analytics

The application includes an analytics framework:

- `EventTracker`: Tracks user events and interactions
- Event categorization and processing
- Integration with external analytics services

## Data Flow

### Service Initialization Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  App Start  │────▶│ Get Service │────▶│  Check If   │────▶│ Return the  │
│             │     │   by Name   │     │ Initialized │     │  Instance   │
└─────────────┘     └─────────────┘     └─────────┬───┘     └─────────────┘
                                                  │ No
                                                  ▼
                         ┌────────────────────────────────────────┐
                         │          Resolve Dependencies          │
                         └────────────────────┬───────────────────┘
                                              │
                         ┌────────────────────▼───────────────────┐
                         │        Create Service Instance         │
                         └────────────────────┬───────────────────┘
                                              │
                         ┌────────────────────▼───────────────────┐
                         │         Initialize Service             │
                         └────────────────────┬───────────────────┘
                                              │
                         ┌────────────────────▼───────────────────┐
                         │    Store in Initialized Services       │
                         └────────────────────────────────────────┘
```

### Component Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│  Use Hooks  │────▶│ Get Service │────▶│ Fetch Data  │
│   Mount     │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  Render UI  │◀────│ Update State│◀────│ Process Data│◀───────────┘
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Directory Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/           # Reusable React components
├── contexts/             # React context providers
├── domains/              # Domain-specific code
├── hooks/                # Custom React hooks
├── layout/               # Layout components
├── lib/                  # Core libraries and utilities
├── services/             # Service implementations
│   ├── api/              # API-specific services
│   ├── analytics/        # Analytics services
│   ├── audio/            # Audio services
│   ├── storage/          # Storage services
│   ├── supabase/         # Supabase integration
│   ├── serviceInterface.ts # Core service interfaces
│   └── serviceRegistry.ts  # Service registry
├── store/                # State management
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Key Technologies

- **Next.js**: React framework for server-rendered applications
- **React**: UI library for building component-based interfaces
- **TypeScript**: Type-safe JavaScript superset
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI / Radix UI**: Component libraries
- **Supabase**: Backend-as-a-Service for database and authentication

## Error Handling

The application implements a comprehensive error handling strategy:

- **Service Errors**: Structured error types with codes and details
- **API Errors**: Standardized handling of network and HTTP errors
- **UI Error Boundaries**: React error boundaries to contain UI errors
- **Retry Mechanisms**: Automatic retry of failed operations with exponential backoff

## Performance Considerations

- **Code Splitting**: Implemented via Next.js for optimized loading
- **Service Initialization**: Services are initialized on-demand
- **Memoization**: React.memo and useMemo for expensive operations
- **Lazy Loading**: Components and data are loaded only when needed

## Security Considerations

- **Authentication**: Secure authentication flow using JWT
- **Data Validation**: Input validation on all user inputs
- **Secure Storage**: Sensitive data stored securely
- **CSP**: Content Security Policy implementation

## Future Architecture Considerations

- **Microfrontends**: Potential split into domain-specific microfrontends
- **Server Components**: Increased usage of Next.js server components
- **Offline Support**: Enhanced offline capabilities with Service Workers
- **Realtime Communication**: Integration of WebSockets for realtime updates

## Deployment Architecture

The application is deployed on Vercel, leveraging:

- Edge functions for API routes
- Static site generation for content pages
- Incremental static regeneration for dynamic content
- Global CDN for asset delivery

---

*This architecture document is a living document and will be updated as the application evolves.*