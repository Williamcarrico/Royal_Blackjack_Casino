# Services Architecture

This directory contains the service layer implementation for the Royal Blackjack Casino application. The services provide a clean separation of concerns and centralized management of various functionalities such as API communication, storage, audio, and analytics.

## Overview

The service architecture follows these key principles:

1. **Singleton Pattern**: Each service is implemented as a singleton, ensuring only one instance exists throughout the application.
2. **Base Service Interface**: All services extend from a common `BaseService` class that provides standard lifecycle methods and error handling.
3. **Dependency Injection**: The `ServiceManager` handles service registration, initialization, and dependency resolution.
4. **React Integration**: Custom hooks provide easy access to services from React components.

## Directory Structure

```
services/
├── api/                  # API communication services
│   ├── authService.ts    # Authentication service
│   ├── gameService.ts    # Game operations service
│   ├── statsService.ts   # Statistics and analytics API service
│   └── userService.ts    # User profile and management service
├── audio/                # Audio management
│   ├── audioManager.ts   # Core audio service
│   ├── audioPreloader.ts # Audio preloading utility
│   └── soundEffects.ts   # Sound effect definitions
├── analytics/            # Analytics services
│   └── eventTracker.ts   # Event tracking and analytics
├── storage/              # Client-side storage services
│   ├── localStorageService.ts # Browser localStorage wrapper
│   └── indexedDBService.ts    # IndexedDB wrapper
├── serviceInterface.ts   # Base interfaces and classes
├── serviceRegistry.ts    # Service dependency management
└── README.md             # This file
```

## Services Overview

### API Services

- **AuthService**: Handles user authentication, session management, and token operations.
- **GameService**: Manages game state, user actions, and game operations.
- **UserService**: Manages user profiles, preferences, and transactions.
- **StatsService**: Handles game statistics, leaderboards, and analytics data.

### Storage Services

- **LocalStorageService**: Provides a wrapper around browser's localStorage with additional features like namespaces, TTL (time-to-live), and type safety.
- **IndexedDBService**: Provides structured database operations for client-side data persistence.

### Audio Services

- **AudioManager**: Handles all audio playback, including sound effects and background music.
- **AudioPreloader**: Preloads audio files for smoother playback.
- **SoundEffects**: Defines all sound effects used in the application.

### Analytics Services

- **EventTracker**: Tracks user events and sends analytics data to the server.

## Using Services

### From React Components

The easiest way to use services in React components is through the specialized hooks:

```tsx
import { useServiceProvider } from '../hooks';

function MyComponent() {
  const { services } = useServiceProvider();

  // Example: Play a sound
  const handleClick = () => {
    services.audio.playSound('button_click');
  };

  return (
    <button onClick={handleClick}>
      Click Me
    </button>
  );
}
```

For specific services, you can use the dedicated hooks:

```tsx
import { useAuthService, useGameService } from '../hooks';

function LoginComponent() {
  const auth = useAuthService();

  const handleLogin = async (credentials) => {
    const result = await auth.login(credentials);
    // Handle login result
  };

  return (
    // Login form
  );
}
```

### From Non-React Code

For utilities or helpers outside of React components, you can access services directly through the ServiceManager:

```ts
import ServiceManager from '../services/serviceRegistry';
import AuthService from '../services/api/authService';

async function checkAuthentication() {
  const authService = await ServiceManager.getInstance().getService<AuthService>('auth');
  return authService.validateToken();
}
```

## Service Initialization

Services are initialized through the `ServiceManager` when they are first requested. You can also pre-initialize services at application startup:

```ts
import { setupServices } from '../utils/serviceInit';

// Initialize application services
setupServices({
  localStorage: { namespace: 'blackjack_app' },
  eventTracker: { endpoint: '/api/analytics' }
});
```

## Creating a New Service

To create a new service:

1. Create a new file for your service that extends `BaseService`
2. Implement the required lifecycle methods (`initializeImpl`, `resetImpl`)
3. Use the singleton pattern with a static `getInstance` method
4. Register your service in `serviceRegistry.ts`
5. Create a specialized hook if needed

Example:

```ts
import { BaseService, ServiceOptions } from '../serviceInterface';

export interface MyServiceConfig extends ServiceOptions {
  // Custom configuration options
}

class MyService extends BaseService {
  private static instance: MyService;

  private constructor(config: MyServiceConfig = {}) {
    super(config);
    // Initialize properties
  }

  public static getInstance(config?: MyServiceConfig): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService(config);
    }
    return MyService.instance;
  }

  protected async initializeImpl(): Promise<void> {
    // Initialization logic
  }

  protected async resetImpl(): Promise<void> {
    // Reset logic
  }

  // Service-specific methods
}

export default MyService;
```

Then register the service in `serviceRegistry.ts`:

```ts
// In the registerDefaultServices method
this.register('myService', MyService);
```

## Error Handling

Services use the `ServiceError` class for consistent error handling. This class includes:

- Error message
- Error code
- Original error (if applicable)

Example:

```ts
try {
  // Service operation
} catch (err) {
  throw new ServiceError(
    'Failed to perform operation',
    'operation_failed',
    err
  );
}
```