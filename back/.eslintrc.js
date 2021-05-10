module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
  },
  plugins: [
    '@typescript-eslint',
  ],
  env: {
    node: true,
  },
  extends: [
    "eslint:recommended",
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "eqeqeq": ["error", "always"],
    "no-console": "error",

    "@typescript-eslint/no-for-in-array": "error",
    "@typescript-eslint/ban-ts-comment": ["error", {
      'ts-expect-error': true,
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': true,
      'ts-check': 'allow-with-description',
      "minimumDescriptionLength": 1,
    }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
}
