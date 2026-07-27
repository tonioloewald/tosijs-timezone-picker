/*
Hydration bundle for the tosijs-timezone-picker doc site.

Bundled to IIFE by tosijs-ui/site's build (per `bundleEntry` in the site config) and
loaded by every page. The import registers <tosijs-timezone-picker>; the `context`
assignment lets a live example's `import { timezones } from 'tosijs-timezone-picker'`
resolve at runtime.
*/

import 'tosijs-ui'
import * as timezonePicker from '../src/index'

for (const el of Array.from(document.querySelectorAll('tosi-doc-system'))) {
  ;(el as any).context = { 'tosijs-timezone-picker': timezonePicker }
}
