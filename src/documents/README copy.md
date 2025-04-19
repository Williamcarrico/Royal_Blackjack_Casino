# Utilities Documentation

## Color Utilities for Animation

To solve the issues with non-animatable OKLCH and OKLAB colors in Framer Motion animations, we've created a set of utility functions in `color-utils.ts`.

### The Problem

Framer Motion cannot animate certain modern color formats like OKLCH and OKLAB, which results in console warnings:

```
hook.js:608 'oklch(0.962 0.059 95.617)' is not an animatable color. Use the equivalent color code instead.
hook.js:608 'oklab(0.769 0.0640531 0.176752 / 0.2)' is not an animatable color. Use the equivalent color code instead.
```

### The Solution

Use the `getAnimatableColor` function or the `useAnimatableColor` hook to convert OKLCH/OKLAB colors to animation-compatible formats (hex, rgb, rgba) before using them in animations.

### Usage Examples

#### Basic Usage

```tsx
import { getAnimatableColor } from '@/utils/color-utils';

// In your component
<motion.div
  animate={{
    backgroundColor: getAnimatableColor('oklch(0.962 0.059 95.617)')
  }}
/>
```

#### With React Hook

```tsx
import { useAnimatableColor } from '@/utils/color-utils';

function MyComponent() {
  const bgColor = useAnimatableColor('oklch(0.962 0.059 95.617)');

  return (
    <motion.div
      animate={{ backgroundColor: bgColor }}
      // ...other props
    />
  );
}
```

#### For CSS Variables

If you're using CSS variables that contain OKLCH/OKLAB values:

```tsx
import { getAnimatableColor } from '@/utils/color-utils';

function MyComponent() {
  // Get the CSS variable
  const root = document.documentElement;
  const cssVar = getComputedStyle(root).getPropertyValue('--accent');

  // Convert to animatable format
  const animatableColor = getAnimatableColor(cssVar);

  return (
    <motion.div
      animate={{ backgroundColor: animatableColor }}
      // ...other props
    />
  );
}
```

### Adding New Colors

If you encounter a color that's not in the mapping, you can add it to the appropriate map in `color-utils.ts`:

```tsx
// For OKLCH colors
export const oklchToHex: ColorMap = {
  // Existing colors...
  'oklch(your-new-color)': '#hexvalue',
};

// For OKLAB colors
export const oklabToRgba: ColorMap = {
  // Existing colors...
  'oklab(your-new-color)': 'rgba(r, g, b, a)',
};
```

## Other Utilities

[Add documentation for other utilities as needed]