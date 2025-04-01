import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Add specific rules for React Hooks
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Enforce Rules of Hooks
      "react-hooks/rules-of-hooks": "error",
      // Verify the list of dependencies for Hooks like useEffect and useCallback
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Add TypeScript specific rules
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Ignore variables that start with an underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
