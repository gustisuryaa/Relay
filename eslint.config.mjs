import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// eslint-config-next ships native flat-config exports as of the Next 16
// line — no FlatCompat bridge needed (and FlatCompat + this package's
// self-referencing plugin configs throws a circular JSON error anyway).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  globalIgnores(['.next/**', 'node_modules/**', 'coverage/**']),
]);

export default eslintConfig;
