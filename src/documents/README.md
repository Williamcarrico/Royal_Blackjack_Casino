# Game State Management

This directory contains the core game state management for the Royal Blackjack Casino application, built using Zustand to provide a centralized, predictable state management solution.

## Architecture Overview

The game state is organized using a "slices" pattern, where different domains of the application state are separated into their own files:

```
/game
  gameStore.ts               # Main entry point and store creation
  /slices
    gameStateSlice.ts        # Core game phases, state, tracking
    playerSlice.ts           # Player management
    handSlice.ts             # Hand management and card interactions
    deckSlice.ts             # Card deck and shoe management
    betSlice.ts              # Betting and wager management
    effectsSlice.ts          # UI effects, sounds, animations
```

## Accessing Game State

To access the game state, you should use the hooks provided in the `/hooks/game` directory rather than directly accessing the store:

```typescript
// Recommended approach
import { useGameState } from '@/hooks/game/state/useGameState';

function MyComponent() {
  const {
    gamePhase,
    players,
    dealCards,
    hit,
    stand
  } = useGameState();

  // Use the state and actions here
}
```

## Available Hooks

1. **useGameState** - Provides core game state and actions
2. **useGameEffects** - Manages side effects like animations and sounds
3. **useGameConfig** - Handles game configuration and initialization

## Slices Structure

Each slice follows a consistent pattern:

```typescript
// Define the slice interface
interface ExampleSlice {
  // State
  someState: string;

  // Actions
  someAction: () => void;
}

// Create the slice
const createExampleSlice: StateCreator<ExampleSlice> = (set, get) => ({
  // Initial state
  someState: 'initial',

  // Actions
  someAction: () => {
    set({ someState: 'updated' });
  }
});

export default createExampleSlice;
```

## Game Flow

The game follows a state machine pattern for phase transitions:

1. `betting` - Player places bets
2. `dealing` - Cards are dealt to players and dealer
3. `playerTurn` - Player decides what actions to take
4. `dealerTurn` - Dealer plays according to rules
5. `settlement` - Bets are settled based on outcomes
6. `completed` - Round is completed

## Example Usage

```typescript
import { useGameState } from '@/hooks/game/state/useGameState';
import { useGameEffects } from '@/hooks/game/effects/useGameEffects';

function GameTable() {
  const {
    gamePhase,
    players,
    dealerHand,
    playerHands,
    dealCards,
    hit,
    stand
  } = useGameState();

  const {
    playCardAnimation,
    playChipAnimation
  } = useGameEffects();

  // Handle a hit action with animation
  const handleHit = () => {
    const success = hit();
    if (success) {
      playCardAnimation('hit', 'newCard', 'playerHand');
    }
  };

  return (
    <div>
      {/* Game UI implementation */}
    </div>
  );
}
```

## Benefits of This Approach

1. **Separation of Concerns** - Each slice handles a specific domain
2. **Testability** - Isolated logic is easier to test
3. **Performance** - Fine-grained updates only when necessary
4. **Type Safety** - Full TypeScript support and type inference
5. **Developer Experience** - Predictable state updates and debugging

## Contributing

When adding new features or modifying game state:

1. Identify which slice should contain the functionality
2. Add the state/actions to the appropriate slice
3. Update interfaces in `/types/storeTypes.ts` if necessary
4. Create or update hooks to expose the new functionality