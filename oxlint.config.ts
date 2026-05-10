import {defineConfig} from "oxlint"

export default defineConfig({
    categories: {
        correctness: "error",
        suspicious: "warn"
    },

    env: {
        browser: true,
        es2024: true
    },

    ignorePatterns: ["dist"],

    options: {typeAware: true},

    overrides: [
        {
            files: ["src/**/*.{ts,tsx}"]
        }
    ],

    plugins: ["typescript", "react"],

    rules: {
        "no-shadow": "off",
        "react-in-jsx-scope": "off",
        "no-unsafe-type-assertion": "off"
    }
})
