import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["**/protodevdefs/**", "**/wasm_exec.js"],
  rules: {
    "eslint/no-unused-vars": ["deny", { caughtErrorsIgnorePattern: "^_" }],
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
