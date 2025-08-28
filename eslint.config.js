import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      "no-const-assign": "error",
      "no-var": "error",
      "no-useless-constructor": "error",
      // "indent": ["error", 2, { SwitchCase: 1 }],
      "init-declarations": "off",
      // "no-undef": "error",
      "no-console": "warn",
      "no-inline-comments": "off",
      "no-irregular-whitespace": "error",
      "semi": "error",
      "semi-spacing": "error",
      "padded-blocks": [
        "error",
        { blocks: "never", classes: "always", switches: "always" }
      ],
      "comma-dangle": [
        "error",
        {
          arrays: "never",
          objects: "never",
          imports: "never",
          exports: "never",
          functions: "never"
        }
      ]
    }
  }
])
