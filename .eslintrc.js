module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@next/next/recommended',
    'prettier' // Add "prettier" last. This will turn off eslint rules conflicting with prettier. This is not what formats the code.
  ],
  rules: {
    '@next/next/no-img-element': 'off',
    "@typescript-eslint/no-inferrable-types": 0,
    "@typescript-eslint/no-unused-vars": 2,
    "@typescript-eslint/no-var-requires": 0,
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off"
  },
  env: {
    browser: true,
    node: true,
    jasmine: true,
  },
}
