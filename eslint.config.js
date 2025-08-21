import babelParser from '@babel/eslint-parser';

export default [
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 9,
        sourceType: "module",
        ecmaFeatures: {
          globalReturn: true,
          impliedStrict: true
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
      globals: {
        window: "readonly",
        document: "readonly"
      }
    },

    rules: {
      "no-const-assign": "error",
      "no-var": "error",
      "no-useless-constructor": "error",
      "indent": ["error", 2, { SwitchCase: 1 }],
      "init-declarations": "off",
      "no-undef": "error",
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
];
