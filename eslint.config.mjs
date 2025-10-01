import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
  { ignores: ["dist", ".next/", "out/", "node_modules/"] },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  ...compat.extends(
    "eslint:recommended",
    "next",
    "next/core-web-vitals",
    "next/typescript",
    "prettier",
  ),
  ...compat.config({
    plugins: ["simple-import-sort", "prettier"],
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // Node.js builtins prefixed with `node:`
            ["^node:"],
            // Packages (things that start with a letter, digit, underscore, or `@` followed by a letter)
            ["^@?\\w"],
            // Internal packages (adjust the pattern to match your project structure)
            ["^(@|components|contexts|hooks|lib|services|types|utils)(/.*|$)"],
            // Side effect imports
            ["^\\u0000"],
            // Parent imports (put `..` last)
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports (put same-folder imports and `.` last)
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports
            ["^.+\\.?(css)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error", // or "error"
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      "prettier/prettier": "warn",
    },
  }),
]

export default eslintConfig
