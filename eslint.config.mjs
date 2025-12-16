import prettierConfig from "eslint-config-prettier"; // ✅ add this
import prettierPlugin from "eslint-plugin-prettier"; // ✅ add this
import pluginJs from "eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import tsParser from "typescript-eslint/parser";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
    },
    plugins: {
      "typescript-eslint": tseslint.plugin,
      prettier: prettierPlugin, // ✅ add prettier plugin
    },
    rules: {
      "no-console": "warn",
      "no-eval": "error",
      eqeqeq: ["error", "always"],

      "no-unused-vars": "off",
      "typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "no-undef": "error",
      "no-constant-condition": "warn",
      "no-duplicate-imports": "error",
      "no-useless-constructor": "error",
      quotes: [
        "error",
        "double",
        { avoidEscape: true, allowTemplateLiterals: true },
      ],

      // ✅ Prettier rule: show formatting issues as warnings
      "prettier/prettier": "warn",
    },
  },

  pluginJs.configs.recommended,

  ...tseslint.configs.recommended,

  // ✅ Add Prettier config to disable conflicting rules
  prettierConfig,
];
