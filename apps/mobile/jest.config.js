// Preserve environment reads in tests that deliberately mutate configuration.
// Retain Expo's transformer/options; override only its test caller's inline flag.
const expoPreset = require('jest-expo/jest-preset')
const scriptTransform = '\\.[jt]sx?$'
const [babelJest, babelOptions] = expoPreset.transform[scriptTransform]

module.exports = {
  preset: 'jest-expo',
  transform: {
    ...expoPreset.transform,
    [scriptTransform]: [
      babelJest,
      {
        ...babelOptions,
        caller: { ...babelOptions.caller, preserveEnvVars: true },
      },
    ],
  },
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
