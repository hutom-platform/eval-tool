module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "eol-last": ["error", "always"],
    "no-useless-return": "error",
    "newline-before-return": "error",
    "no-unused-vars": "warn",
    "spaced-comment": ["error", "always"],
  },
};
