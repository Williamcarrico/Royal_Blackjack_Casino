# Royal Blackjack Casino Type System

This directory contains the TypeScript type definitions for the Royal Blackjack Casino application.

## Type System Structure

The type system has been designed with the following goals:

- **Type Safety**: Using branded types and enums to prevent accidental mixing of types
- **Organization**: Logical grouping of related types
- **Maintainability**: Clear documentation and consistent naming conventions
- **Performance**: Efficient type checking with minimal overhead

## Directory Structure

```
src/types/
├── index.ts              # Main export file
├── enums.ts              # All enum definitions
├── branded.ts            # Branded types for improved type safety
├── models/               # Domain model types
│   ├── index.ts          # Models export file
│   ├── auth.ts           # Authentication types
│   ├── bet.ts            # Betting types
│   ├── card.ts           # Card types
│   ├── game.ts           # Game types
│   ├── hand.ts           # Hand types
│   ├── player.ts         # Player types
│   ├── stats.ts          # Statistics types
│   └── ui.ts             # UI types
├── authTypes.ts          # Legacy auth types (use models/auth.ts instead)
├── betTypes.ts           # Legacy bet types (use models/bet.ts instead)
├── componentTypes.ts     # Component prop types
├── gameTypes.ts          # Legacy game types (use models/game.ts instead)
├── gameState.ts          # Legacy game state types (use models/stats.ts instead)
├── handTypes.ts          # Legacy hand types (use models/hand.ts instead)
├── notifications.ts      # Notification types
├── storeTypes.ts         # Store/state management types
├── supabase.ts           # Supabase database types
├── uiTypes.ts            # Legacy UI types (use models/ui.ts instead)
├── utilTypes.ts          # Utility types
└── apiTypes.ts           # API types
```

## Key Features

### 1. Enums Instead of String Unions

We've replaced string unions with proper TypeScript enums for domains like:
- Game phases
- Outcomes
- Chip sizes
- Card suits and ranks
- User roles
- Bet statuses

Using enums provides better autocompletion, validation, and runtime safety.

Example:
```typescript
// Before
type GamePhase = 'betting' | 'dealing' | 'playerTurn' | 'dealerTurn' | 'settlement' | 'cleanup' | 'completed';

// After
enum GamePhase {
  BETTING = 'betting',
  DEALING = 'dealing',
  PLAYER_TURN = 'playerTurn',
  DEALER_TURN = 'dealerTurn',
  SETTLEMENT = 'settlement',
  CLEANUP = 'cleanup',
  COMPLETED = 'completed'
}
```

### 2. Branded Types

Branded types add nominal typing to TypeScript's structural type system, preventing accidental mixing of different types with the same underlying representation.

Example:
```typescript
// Define a branded type
type CardID = string & { readonly __brand: 'CardID' };

// Incorrect usage will cause type errors
const handId: HandID = 'card_123'; // Error: Type 'string' is not assignable to type 'HandID'
```

### 3. Consolidated Models

Domain models are now organized in a dedicated `models` directory, with each domain area having its own file.

### 4. Type Guards

Type guards are provided for branded types to ensure type safety at runtime:

```typescript
function isCardID(value: string): value is CardID {
  return typeof value === 'string' && /^card_[a-zA-Z0-9]+$/.test(value);
}
```

## Usage

Import types from the index file:

```typescript
import { GamePhase, CardID, Hand, Player } from '@/types';
```

For specific domains, you can import directly from the relevant model file:

```typescript
import { Card, CardSuit, CardRank } from '@/types/models/card';
```

## Migration

The new type system is designed to be backward compatible with the existing codebase. Legacy type files are maintained while new development should use the improved structure.

To migrate existing code:

1. Update imports to use the new structure
2. Replace string unions with enums
3. Use branded types for IDs and other critical fields
4. Use the type guards for runtime validation

## Guidelines for Adding New Types

1. Place domain-specific types in the appropriate model file
2. Use enums for fixed sets of values
3. Use branded types for IDs and other critical fields
4. Add proper JSDoc comments for all types
5. Update the index.ts file when adding new files