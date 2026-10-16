import http from 'node:http'
import os from 'node:os'

// A LAN-only API proxy. MySQL and the Spring Boot listener remain on loopback.
const host = process.argv[2]
const port = Number(process.argv[3] || 8083)
const addresses = Object.values(os.networkInterfaces()).flat().filter(Boolean)
if (
  !host ||
  !addresses.some(
    (address) => address.family === 'IPv4' && !address.internal && address.address === host,
  )
)
  throw new Error('Pass an IPv4 address currently assigned to this computer (not 0.0.0.0).')
const octets = host.split('.').map(Number)
if (!(
  octets[0] === 10 ||
  (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
  (octets[0] === 192 && octets[1] === 168)
))
  throw new Error('Only an RFC1918 private LAN address is permitted.')
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid proxy port')
const server = http.createServer((request, response) => {
  if (!(request.url === '/api/v1' || request.url.startsWith('/api/v1/'))) {
    response.writeHead(404).end()
    return
  }
  const headers = { ...request.headers, host: '127.0.0.1:8082' }
  delete headers['forwarded']
  delete headers['x-forwarded-for']
  delete headers['x-forwarded-host']
  delete headers['x-forwarded-proto']
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: 8082,
      method: request.method,
      path: request.url,
      headers,
      timeout: 30000,
    },
    (result) => {
      response.writeHead(result.statusCode || 502, result.headers)
      result.pipe(response)
    },
  )
  upstream.on('timeout', () => upstream.destroy())
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502)
    response.end('Local backend unavailable')
  })
  request.on('aborted', () => upstream.destroy())
  request.pipe(upstream)
})
server.requestTimeout = 30000
server.listen(port, host, () =>
  console.log(
    `Internal test API proxy: http://${host}:${port}/api/v1 -> loopback:8082. Trusted Wi-Fi/test accounts only. Ctrl+C stops it.`,
  ),
)
