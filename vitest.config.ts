import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import webConfig from './vite.config.ts'
export default mergeConfig(
  webConfig,
  defineConfig({ test: { exclude: [...configDefaults.exclude, 'apps/**'] } }),
)
