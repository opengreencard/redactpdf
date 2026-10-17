const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Plain CommonJS config for Jest. Typing it would need a .ts file.
// eslint-disable-next-line no-restricted-syntax -- see the comment above
const customJestConfig = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/lib/testUtilities/setup.ts'],
};

async function jestConfig() {
  const nextJestConfig = await createJestConfig(customJestConfig)();

  // Workaround to overriding transformIgnorePatterns from
  // https://github.com/vercel/next.js/issues/35634#issuecomment-1115250297
  nextJestConfig.transformIgnorePatterns[0] =
    '/node_modules/(?!(next-auth|@auth/core|oauth4webapi|@auth/sequelize-adapter|add-more-packages-here)).+\\.(js|mjs|cjs)$';
  nextJestConfig.globalSetup = './lib/testUtilities/globalSetup.ts';
  return nextJestConfig;
}

module.exports = jestConfig;
