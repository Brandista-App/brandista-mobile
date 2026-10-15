module.exports = {
  preset: 'jest-expo',
  testTimeout: 15000,
  // Resolve the core bundled by Expo, whether npm hoists it or nests it.
  moduleNameMapper: {
    '^expo-modules-core/(.*)$': require('node:path').join(
      require('node:path').dirname(
        require.resolve('expo-modules-core/package.json', {
          paths: [require.resolve('expo/package.json')],
        }),
      ),
      '$1',
    ),
    '^expo-modules-core$': require.resolve('expo-modules-core', {
      paths: [require.resolve('expo/package.json')],
    }),
  },
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
}
