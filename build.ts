import { $ } from 'bun'
import { rmSync, cpSync } from 'fs'

// clean
for (const dir of ['dist', 'cdn', 'docs']) {
  rmSync(dir, { recursive: true, force: true })
}

// run tests first
const testResult = await $`bun test`.quiet()
if (testResult.exitCode !== 0) {
  console.error(testResult.stderr.toString())
  process.exit(1)
}
console.log('Tests passed.')

// dist build (ESM library, externalize tosijs)
const distResult = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  format: 'esm',
  sourcemap: 'external',
  external: ['tosijs'],
  naming: 'index.js',
})
if (!distResult.success) {
  console.error('dist build failed:', distResult.logs)
  process.exit(1)
}
console.log('Built dist/')

// cdn build (ESM library, externalize tosijs, minified)
const cdnResult = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'cdn',
  format: 'esm',
  sourcemap: 'external',
  external: ['tosijs'],
  minify: true,
  naming: 'index.js',
})
if (!cdnResult.success) {
  console.error('cdn build failed:', cdnResult.logs)
  process.exit(1)
}
console.log('Built cdn/')

// generate .d.ts files (noEmitOnError is false, so declarations are emitted despite type errors)
const tscResult = await $`bunx tsc --project tsconfig.build.json`.nothrow().quiet()
if (tscResult.exitCode !== 0) {
  console.warn('tsc reported issues (declarations still emitted):', tscResult.stdout.toString())
}
console.log('Generated type declarations.')

// docs build — externalize tosijs, serve via import map
const docsResult = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'docs',
  format: 'esm',
  sourcemap: 'external',
  external: ['tosijs'],
  minify: true,
  naming: 'index.js',
})
if (!docsResult.success) {
  console.error('docs build failed:', docsResult.logs)
  process.exit(1)
}

// bundle tosijs separately for docs
const tosijsResult = await Bun.build({
  entrypoints: ['node_modules/tosijs/dist/module.js'],
  outdir: 'docs',
  format: 'esm',
  minify: true,
  naming: 'tosijs.js',
})
if (!tosijsResult.success) {
  console.error('tosijs docs build failed:', tosijsResult.logs)
  process.exit(1)
}

// copy demo/index.html to docs/, injecting import map
const html = await Bun.file('demo/index.html').text()
const importMap = `<script type="importmap">{"imports":{"tosijs":"./tosijs.js"}}</script>`
const docsHtml = html.replace('<script ', importMap + '\n    <script ')
await Bun.write('docs/index.html', docsHtml)
await Bun.write('docs/CNAME', 'timezones.tosijs.net')

// copy static assets from demo/
for (const asset of ['favicon.ico', 'favicon.png']) {
  try {
    cpSync(`demo/${asset}`, `docs/${asset}`)
  } catch {
    // skip missing assets
  }
}

console.log('Built docs/')
console.log('Build complete.')
