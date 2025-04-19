# Card Module Migration Guide

## Overview

This document outlines the migration from the previous duplicate implementations of deck management hooks (`useCardDeck.ts` and `useDeck.ts`) to a new consolidated structure that separates core logic from UI concerns.

## New Structure

```
/cards
  /core
    - deckUtils.ts (core deck functions)
    - handUtils.ts (core hand functions)
  /hooks
    - useCardDeck.ts (simplified)
    - useHand.ts (uses core utilities)
```

## Motivation

The previous structure had several issues:
1. Duplicate functionality between `useCardDeck.ts` and `useDeck.ts`
2. No clear separation between business logic and UI concerns
3. Code duplication leading to maintenance challenges
4. Harder to test business logic independent from React components

## Migration Steps

### 1. Core Utilities

We've extracted pure functions into utility files:

- `deckUtils.ts`: Contains core deck operations (creating, shuffling, dealing)
- `handUtils.ts`: Contains core hand calculations (value calculation, checking for blackjack/bust)

These utility functions are pure and don't depend on React or Zustand state management, making them easier to test and reuse.

### 2. Simplified Hooks

The hooks have been simplified to:
- Use the core utilities for calculations
- Focus on state management with Zustand
- Handle UI-specific concerns

### 3. Updating References

For any code that referenced `useDeck.ts`, update imports to use `useCardDeck.ts` instead.

Example:

```typescript
// Before
import { useDeck } from '../hooks/game/useDeck';

// After
import { useCardDeck } from '../cards/hooks/useCardDeck';
```

## API Changes

### useCardDeck

The new `useCardDeck` exposes the same core functionality as before but with a more consistent API:

- `createDeck`, `createDecks` - Create one or more decks
- `shuffleCards` - Shuffle using various algorithms
- `initializeShoe` - Initialize deck shoe
- `deal`, `dealMultiple` - Deal cards
- `shuffle` - Shuffle existing shoe
- State variables (shoe, isShuffling, cardsDealt, etc.)

### useHand

The `useHand` hook focuses on hand management:

- Hand creation and initialization
- Actions (hit, stand, double, split, etc.)
- Hand evaluation and comparison
- Exposes core utilities for hand calculations

## Testing

With this new structure, you can:

1. Unit test the core utilities without React testing libraries
2. Mock the core utilities when testing hooks
3. Test UI components independently from business logic

## Examples

### Using Core Utilities Directly

```typescript
import { calculateValues, determineBestValue, isBlackjack } from '../cards/core/handUtils';

// Calculate hand values
const cards = [/* ... */];
const values = calculateValues(cards);
const bestValue = determineBestValue(values);
```

### Using the Hooks

```typescript
import { useCardDeck } from '../cards/hooks/useCardDeck';
import { useHand } from '../cards/hooks/useHand';

function GameComponent() {
  const { initializeShoe, deal, shuffle } = useCardDeck();
  const { initializeHand, performHit, performStand } = useHand();

  // Rest of component...
}
```

## Best Practices

1. Use core utilities directly for pure calculations
2. Use hooks for state management and UI interactions
3. Keep UI components focused on rendering, delegating business logic to hooks and utilities
4. Write unit tests for core utilities separately from hooks