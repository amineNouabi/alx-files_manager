module.exports = {
    env: {
        browser: false,
        es6: true,
        jest: true,
    },
    extends: [
      'airbnb-base',
      'plugin:jest/all'
    ],
    globals: {
      Atomics: 'readonly',
      SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
    },
    plugins: ["jest"],
    rules: {
      'max-classes-per-file': 'off',
      'no-underscore-dangle': 'off',
      'no-console': 'off',
      'no-shadow': 'off',
      'no-restricted-syntax': [
        'error',
        'LabeledStatement',
        'WithStatement',
      ],
    },
    overrides:[
      {
        files: ['*.js'],
        excludedFiles: 'babel.config.js',
      },
      {
        files: ['tests/**/*.test.js', 'tests/*.test.js'],
        env: {
            mocha: true
        },
        plugins: ['mocha'],
        globals: {
          expect: 'readonly',
          assert: 'readonly',
          request: 'readonly',
          app: 'readonly',
          dbClient: 'readonly',
          redisClient: 'readonly'
        }
      }
    ]
};
