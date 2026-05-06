import eslint from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config([
    {ignores: ["dist"]},
    {
        extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked],
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: globals.browser,
            parserOptions: {
                project: "./tsconfig.app.json"
            }
        },
        plugins: {
            "react-hooks": reactHooks
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "func-style": ["error", "declaration"],
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "sort-imports": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "no-async-promise-executor": "off",
            "no-empty": "off",
            "prefer-const": "off"
        }
    }
])
