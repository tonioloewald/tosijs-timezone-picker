/*
Doc-site configuration for tosijs-timezone-picker.

Consumed by `bin/site.ts` (the one build entry) and fed to tosijs-ui/site's
`buildSite` / `devServer`. See `tosijs-ui/src/doc-system/site/site-config.ts`
for the full set of options.
*/

import { defineSiteConfig } from 'tosijs-ui/site'

const PROJECT = 'tosijs-timezone-picker'

export default defineSiteConfig({
  name: PROJECT,
  description:
    'A lightweight, mobile-friendly timezone-picker web-component: an interactive SVG world map plus offset-aware autocomplete, with no timezone dataset to ship.',
  baseUrl: 'https://timezones.tosijs.net',
  host: 'github-pages',
  favicon: '/favicon.svg',

  // 8787 is tosijs-ui's, 8788 tosijs-product's, 8789 editor2's — take the next one so
  // every ecosystem dev server can run at once.
  port: 8790,

  projectLinks: {
    tosijs: 'https://tosijs.net',
    github: `https://github.com/tonioloewald/${PROJECT}`,
  },

  navbarLinks: [
    { href: 'https://tosijs.net', label: 'tosijs', icon: 'tosi' },
    { href: 'https://ui.tosijs.net', label: 'tosijs-ui', icon: 'tosi' },
    {
      href: `https://github.com/tonioloewald/${PROJECT}`,
      label: 'github',
      icon: 'github',
    },
    {
      href: `https://www.npmjs.com/package/${PROJECT}`,
      label: 'npmjs',
      icon: 'npm',
    },
  ],

  // Registers <tosijs-timezone-picker> and exposes our exports to live examples.
  bundleEntry: './demo/site.ts',

  // README is the home page; src/ is scanned for doc-comment blocks (and src/docs/ for
  // the generated section pages). 'docs' is the outputDir — never a source.
  docPaths: ['src', 'README.md'],

  // Dev-server "Edit page source": edit a page's markdown in the browser and save back
  // to disk. Local only; writes are confined to the repo root.
  editableSources: true,

  // bin/site.ts builds dist/ + cdn/ itself — the package ships more shapes than the
  // stock `tsc --declaration` step emits (see the note there).
  emitLibrary: false,
})
