import assert from 'node:assert/strict'
import { apiBase } from '../src/lib/config'

async function main() {
  const base = apiBase(process.env.EXPO_PUBLIC_API_BASE_URL, false)
  const response = await fetch(`${base}/products?page=0&size=1`, {
    signal: AbortSignal.timeout(20000),
    redirect: 'error',
  })
  assert(response.ok, `Public catalogue unreachable: HTTP ${response.status}`)
  const body = await response.json()
  assert(Array.isArray(body.content), 'Backend did not return the expected catalogue contract')
  console.log(`Verified reachable catalogue API: ${base}`)
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
