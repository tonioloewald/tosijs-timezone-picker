# Changelog

All notable changes to this project are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0]

The component is now a **tosijs blueprint** that the package hydrates for you, the demo page
has been replaced by a real doc site, and several long-standing bugs are fixed. The public
API is unchanged: `import 'tosijs-timezone-picker'` still registers
`<tosijs-timezone-picker>`, and `timezonePicker` / `TimezonePicker` / `timezones` /
`localTimezone` / `regions` are still exported from the package root.

### Added

- **`dist/blueprint.js`** — the component as a self-contained
  [`XinBlueprint`](https://tosijs.net/blueprint-loader/) with no tosijs import of its own, so
  it can be loaded from a CDN by `<tosi-blueprint>` under a tag name of the consumer's
  choosing. Also exported as `blueprint` from the package root and as the
  `tosijs-timezone-picker/blueprint` entry point.
- **Doc site** at [timezones.tosijs.net](https://timezones.tosijs.net), built with the
  tosijs-ui doc system: live, editable examples for the element, the styling variables, and
  the `Intl`-derived data. Replaces the hand-rolled demo page. `llms.txt` is generated with it.
- New exports: `TAG_NAME`, `makeTimezonePickerClass`, `zoneFromName`, `zoneFromId`, `zoneId`,
  `timezoneAliases`, `regionId`, `zoneFromRegion`, and the `TimezonePickerElement` /
  `TimezonePickerParts` types.
- Component tests (happy-dom) covering registration, value/timezone sync, and per-instance
  DOM; data tests covering alias consistency, offset sanity and `zoneId` round-tripping.

### Fixed

- **Quarter-hour timezones had `NaN` offsets.** The offset parser only understood `:30`, so
  Nepal (+5:45), Chatham (+12:45) and Eucla (+8:45) parsed as `NaN` — they showed no GMT
  offset in the picker and, because nothing compares equal to `NaN`, their regions were
  orphaned from every offset band.
- **`value` did not follow the `timezone` attribute.** `<tosijs-timezone-picker
  timezone="Australia/Sydney">` painted Sydney on the map but reported the *local* zone as its
  `value` until the user interacted with it. `value` and `timezone` are now reconciled in both
  directions, with no spurious `change` event on the initial reconcile.
- **The initial selection was invisible.** The map is appended after the base class's first
  render, so nothing was highlighted until some later event triggered a re-render.
- **A second picker on the page had no autocomplete.** All instances shared one `<datalist>`
  node, so whichever picker connected last took it from the others.
- **`America/Coral_Harbour` aliased to `America/Edmonton`** — an hour further west, and it
  observes DST. It now aliases to `America/Panama`, per tzdb.
- `localTimezone` could be `undefined` if the runtime reported a zone missing from
  `Intl.supportedValuesOf('timeZone')` (typically a deprecated alias); it now resolves through
  the alias table and falls back to UTC.
- Removed an invalid `alt` attribute from the generated `<svg>`.

### Changed

- Hover and selection repaint the map in a single pass over a cached polygon list, instead of
  re-querying the DOM three times per `mouseover`.
- The SVG map and the `<datalist>` options are built once and cloned per instance.
- Styles are declared with tosijs's `varDefault` rather than hand-written `var()` strings. The
  CSS custom property names are unchanged.
- The map's focus ring now uses `:focus-visible`, so clicking the map no longer leaves a ring.
- `peerDependencies` requires `tosijs ^1.7.5`; `package.json` gains `main`, `module` and a
  proper `exports` map, and `files` is explicit rather than whole directories.
- Build and dev server are now one entry point, `bin/site.ts` (`bun run build` / `bun start`);
  `dev.ts` and `build.ts` are gone.

### Removed

- The `--offset-filter` CSS variable and its `polygon.offset` rule: nothing ever applied that
  class, so the variable did nothing.

## [0.5.3]

- Keyboard navigation, tooltips, ARIA support.

## [0.5.2]

- Hover/active region highlighting, tooltips, alias fixes.

## [0.5.1]

- Favicon and packaging fixes.

## [0.5.0]

- Migrated to tosijs 1.5.x and a Bun-based build; renamed from `xinjs-timezone-picker`.
