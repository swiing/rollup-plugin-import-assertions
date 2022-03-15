// derived from https://github.com/rollup/plugins/blob/master/.eslintrc.js
// Principle is that we want to use the same configuration as official rollup plugins
// https://github.com/rollup/plugins

// The official rollup plugins basically make use of:
// - https://github.com/rollup/plugins/blob/master/packages/.eslintrc
// - https://github.com/rollup/plugins/blob/master/.eslintrc.js
// - https://github.com/rollup/eslint-config-rollup

module.exports = {
  // comment out plugin as this is not a typescript repository
  // Should this repository one day move to typescript, code should be put back in
  extends: ['rollup' /* , 'plugin:import/typescript' */],

  // comment out as this is not a typescript repository
  // Should this repository one day move to typescript, the following lines should be put back in
  // parserOptions: {
  // project: ['./tsconfig.eslint.json'],
  // tsconfigRootDir: __dirname
  // },
  rules: {
    // disabling sort keys for now so we can get the rest of the linting shored up
    'sort-keys': 'off',

    // from https://github.com/rollup/plugins/blob/master/packages/.eslintrc
    'import/no-extraneous-dependencies': 'off',

    // disabling typescript specific rules which are set by the default rollup configuration
    // (https://github.com/rollup/eslint-config-rollup/blob/master/configs/config.json)
    // Note: not disabling explicitly will make the linter unable to create the rules
    // (and fail) because this package does not include all the necessary typescript stuff.
    // Should this repository one day move to typescript, the following lines should be removed
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off'
  },
  overrides: [
    {
      files: ['**/fixtures/**'],
      rules: {
        'no-console': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': 'off'
      }
    },
    {
      files: ['**/test/**'],
      rules: {
        'import/extensions': 'off'
      }
    }
  ]
};
