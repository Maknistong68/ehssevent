import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Accessibility linting (a11y is a production concern for this app).
  // eslint-config-next already registers the `jsx-a11y` plugin, so apply the
  // recommended *rules* only — re-registering the plugin throws a config error.
  {
    rules: jsxA11y.flatConfigs.recommended.rules,
  },

  // Static security linting. Introduced as warnings so it surfaces issues
  // without breaking the existing build; tighten to errors over time.
  security.configs.recommended,
  {
    rules: {
      // High false-positive rate on safe internal property access; TypeScript
      // already covers the real cases. Disable to keep the signal useful.
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'warn',
      // False positives against component-library controls: the shadcn `Label`
      // primitive associates via `htmlFor` at call sites, and nested custom
      // controls (e.g. `Checkbox`) aren't recognized as native inputs. Surface
      // as a warning rather than failing the build on intentional patterns.
      'jsx-a11y/label-has-associated-control': 'warn',
    },
  },

  // Turn off ESLint formatting rules that conflict with Prettier (keep last).
  prettier,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
  ]),
])

export default eslintConfig
