// Uses the existing lockfile's Expo image decoder. No new dependency or image edit.
const Jimp = require('jimp-compact')
const { createHash } = require('node:crypto')
async function digest(encoded) {
  const image = await Jimp.read(Buffer.from(encoded, 'base64'))
  return createHash('sha256')
    .update(`${image.bitmap.width}x${image.bitmap.height}:`)
    .update(image.bitmap.data)
    .digest('hex')
}
async function main() {
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  const { originals, packaged } = JSON.parse(input)
  const found = new Set()
  for (const encoded of Object.values(packaged)) found.add(await digest(encoded))
  for (const [name, encoded] of Object.entries(originals)) {
    if (!found.has(await digest(encoded))) throw new Error(`Missing exact decoded showcase pixels: ${name}`)
    console.log(`Verified exact decoded showcase pixels: ${name}`)
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
