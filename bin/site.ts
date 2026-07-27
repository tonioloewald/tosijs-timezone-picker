/*
Build entry — a thin wrapper over tosijs-ui/site's build system, and the ONLY build
script in this repo.

  bun bin/site.ts              # build, then start the dev server
  bun bin/site.ts --build      # build and exit (0/1)

`buildSite` produces the doc site (static pages, hydration bundle, llms.txt) into docs/.
`buildLibrary` produces the npm artefacts, which is why the site config sets
`emitLibrary: false` — the stock step is `tsc --declaration` alone, and this package
ships three JS shapes as well:

  dist/index.js      ESM, tosijs external — the package entry
  dist/blueprint.js  self-contained ESM — the XinBlueprint, loadable from a CDN by
                     <tosi-blueprint> with no tosijs import of its own
  cdn/index.js       minified ESM — the long-standing CDN path, kept working
  dist/*.d.ts        types, from tsconfig.build.json

Everything shells out to the `bun build` CLI rather than calling `Bun.build()` in-process:
the bundler never returns its native arena, so a watching dev server that rebuilds for
days climbs to tens of GB of RSS. A child process gives the memory back on exit.
*/

import { $ } from 'bun'
import siteConfig from '../tosijs-timezone-picker-site.config'
import { buildSite, devServer } from 'tosijs-ui/site'

async function buildLibrary(): Promise<void> {
  // types first: tsc is the slowest step and the most likely to fail loudly
  const types =
    await $`bunx tsc --project tsconfig.build.json`.nothrow().quiet()
  if (types.exitCode !== 0) {
    // declarations are still emitted (noEmitOnError: false) — surface, don't stop
    console.warn(`tsc reported issues:\n${types.stdout.toString()}`)
  }

  await $`bun build ./src/index.ts --outdir dist --target browser --format esm --external tosijs --sourcemap=external`.quiet()

  // No --external: a blueprint receives tosijs as an argument, so it must not import it.
  await $`bun build ./src/blueprint.ts --outdir dist --target browser --format esm --minify --sourcemap=external`.quiet()

  await $`bun build ./src/index.ts --outdir cdn --target browser --format esm --external tosijs --minify --sourcemap=external`.quiet()
}

const buildAll = async (): Promise<void> => {
  if (!(await buildSite(siteConfig))) throw new Error('site build failed')
  await buildLibrary()
}

if (!(await buildSite(siteConfig))) process.exit(1)
await buildLibrary()

if (process.argv.includes('--build')) process.exit(0)

await devServer(siteConfig, { build: buildAll })
