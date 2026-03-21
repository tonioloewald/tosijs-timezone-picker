import { watch } from 'fs'
import { join } from 'path'

const PORT = 8777
const SRC_DIR = join(import.meta.dir, 'src')
const DEMO_DIR = join(import.meta.dir, 'demo')
const TOSIJS_MODULE = join(import.meta.dir, 'node_modules/tosijs/dist/module.js')

async function buildBundle() {
  const result = await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'www',
    format: 'esm',
    sourcemap: 'external',
    external: ['tosijs'],
  })
  if (!result.success) {
    console.error('Build failed:', result.logs)
  }
  return result.success
}

await buildBundle()

const IMPORT_MAP = `<script type="importmap">{"imports":{"tosijs":"./tosijs.js"}}</script>`

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname

    if (path === '/' || path === '/index.html') {
      const html = await Bun.file(join(DEMO_DIR, 'index.html')).text()
      // inject import map before the first <script>
      const patched = html.replace('<script ', IMPORT_MAP + '\n    <script ')
      return new Response(patched, { headers: { 'Content-Type': 'text/html' } })
    }

    // serve tosijs module
    if (path === '/tosijs.js') {
      return new Response(Bun.file(TOSIJS_MODULE), {
        headers: { 'Content-Type': 'application/javascript' },
      })
    }

    // serve built bundle
    const wwwFile = Bun.file(join(import.meta.dir, 'www', path))
    if (await wwwFile.exists()) {
      return new Response(wwwFile)
    }

    // serve demo assets (favicon, etc.)
    const demoFile = Bun.file(join(DEMO_DIR, path))
    if (await demoFile.exists()) {
      return new Response(demoFile)
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Dev server running at http://localhost:${PORT}`)

// watch for changes and rebuild
for (const dir of [SRC_DIR, DEMO_DIR]) {
  watch(dir, { recursive: true }, async (_event, filename) => {
    console.log(`Changed: ${filename}, rebuilding...`)
    await buildBundle()
  })
}
