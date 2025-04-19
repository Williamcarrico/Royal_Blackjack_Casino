# JSDoc Style Guide

This document outlines the standards and best practices for documentation in the Royal Blackjack Casino codebase.

## Goals

- **Consistency**: Maintain a consistent documentation style across the codebase
- **Completeness**: Document all public APIs, interfaces, and components
- **Clarity**: Write clear, concise descriptions that explain purpose and usage
- **Developer Experience**: Improve code comprehension and ease of use

## JSDoc Standards

### Module Documentation

All files that export functionality should include a module-level JSDoc comment:

```typescript
/**
 * Module description that explains the purpose and content
 * of this file
 *
 * @module ModuleName
 */
```

### Function/Method Documentation

All public functions and methods should include:

```typescript
/**
 * Brief description of what the function does
 *
 * Detailed description if needed for complex functions
 *
 * @param {Type} paramName - Description of parameter
 * @returns {ReturnType} Description of return value
 * @throws {ErrorType} When/why this error might be thrown
 *
 * @example
 * ```typescript
 * const result = myFunction('example');
 * // result: expected output
 * ```
 */
```

### Interface/Type Documentation

Interfaces and types should be documented as:

```typescript
/**
 * Brief description of what this interface represents
 *
 * @interface InterfaceName
 */
interface ExampleInterface {
  /**
   * Description of this property
   */
  propertyName: string;

  /**
   * Description of this method
   *
   * @param {Type} paramName - Description
   * @returns {ReturnType} Description
   */
  methodName(paramName: Type): ReturnType;
}
```

### React Components

React components should include:

```typescript
/**
 * Brief description of the component's purpose and functionality
 *
 * @component
 * @example
 * ```tsx
 * <MyComponent prop1="value" prop2={42} />
 * ```
 */
```

### React Hook Documentation

Custom hooks should follow this pattern:

```typescript
/**
 * Brief description of what the hook does
 *
 * @template T - Type parameter description
 * @param {ParamType} paramName - Description
 * @returns {ReturnType} Description of returned values/functions
 *
 * @example
 * ```tsx
 * const [state, setState] = useMyHook(initialValue);
 * ```
 */
```

### Tag Standards

We use the following JSDoc tags consistently:

| Tag | Usage |
|-----|-------|
| `@module` | At the top of a file to document the module |
| `@param` | Document function/method parameters |
| `@returns` | Document return values |
| `@throws` | Document possible errors |
| `@example` | Provide usage examples |
| `@interface` | Document interfaces |
| `@type` | Document the type of a variable |
| `@property` | Document properties of an object/interface |
| `@template` | Document type parameters |
| `@see` | Reference related documentation |
| `@deprecated` | Mark methods/functions as deprecated |
| `@todo` | Document planned work (avoid in production code) |
| `@private` | Mark items as private (not part of public API) |

## Style Rules

### Descriptions

- Start with a capital letter and use proper punctuation
- Use present tense, active voice (e.g., "Gets the value" not "Get the value")
- Be concise but complete - aim for a single sentence where possible
- For complex items, add a more detailed description after the initial brief description

### Parameters and Return Values

- Document all parameters including type information
- Document return values with type information
- Use sentence case for descriptions (start with capital letter)
- End descriptions with periods
- Include range or restrictions if applicable

### Examples

- Include practical, simple examples for complex functions/components
- Make sure examples are valid and would work if copied directly

### Formatting

- Use properly formatted Markdown in documentation blocks
- Keep line lengths reasonable (under 100 characters)
- Use multiline format for longer documentation
- Add a blank line between the description and tags

## File Type-Specific Guidelines

### Service Files

Service files should document:
- The purpose of the service
- All public methods
- Configuration options
- Error states and handling
- Initialization requirements

### Hook Files

Hook files should document:
- The purpose and use case for the hook
- Parameters and return values
- Side effects
- Performance considerations
- Example usage

### Component Files

Component files should document:
- The component's purpose
- All props including type information
- State managed by the component
- Side effects
- Accessibility considerations
- Example usage

## Implementation Strategy

1. **Priority Order**: Focus first on:
   - Public APIs and services
   - Shared hooks and utilities
   - Complex domain logic
   - Key components

2. **Review Process**: Documentation should be reviewed for:
   - Accuracy
   - Completeness
   - Clarity
   - Conformance to this style guide

3. **Tooling**:
   - Use ESLint plugins for JSDoc validation
   - Consider documentation generation tools

## Examples

### Good Example - Service Method

```typescript
/**
 * Authenticates a user with the provided credentials.
 *
 * This method handles the authentication flow including token management,
 * error handling, and persisting the authenticated session.
 *
 * @param {string} username - The user's email or username
 * @param {string} password - The user's password
 * @returns {Promise<User>} The authenticated user object
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {NetworkError} When the authentication service is unavailable
 *
 * @example
 * ```typescript
 * try {
 *   const user = await authService.login('user@example.com', 'password123');
 *   // User is now authenticated
 * } catch (error) {
 *   // Handle authentication failure
 * }
 * ```
 */
async login(username: string, password: string): Promise<User> {
  // Implementation
}
```

### Good Example - React Hook

```typescript
/**
 * A hook that manages the game state for a blackjack round.
 *
 * This hook handles player actions, dealer logic, and game outcome
 * determination according to blackjack rules.
 *
 * @param {GameOptions} options - Configuration options for the game
 * @returns {GameState & GameActions} Current game state and available actions
 *
 * @example
 * ```tsx
 * const {
 *   playerHand,
 *   dealerHand,
 *   gameStatus,
 *   hit,
 *   stand,
 *   doubleDown
 * } = useBlackjackGame({ decks: 6 });
 * ```
 */
export function useBlackjackGame(options: GameOptions) {
  // Implementation
}
```

---

*This style guide is a living document and will be updated as our documentation practices evolve.*