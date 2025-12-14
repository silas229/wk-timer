import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config} */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".next/**",
      "coverage/**",
      "public/**",
      "next.config.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Base React config then layer Next + Hooks on top.
    ...pluginReact.configs.flat.recommended,
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...pluginReact.configs.flat.recommended.languageOptions?.globals,
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    plugins: {
      ...pluginReact.configs.flat.recommended.plugins,
      "@next/next": pluginNext,
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      semi: ["warn", "always"],
    },
  },
  eslintConfigPrettier
);
