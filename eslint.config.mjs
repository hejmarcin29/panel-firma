import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const ignores = [
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
];

// Jeśli zmienna środowiskowa SKIP_LINT jest ustawiona, ignorujemy wszystkie pliki
if (process.env.SKIP_LINT) {
  ignores.push("**/*");
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores(ignores),
]);

export default eslintConfig;
