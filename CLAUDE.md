# CLAUDE.md

> **Shared engineering practices** live at
> **https://github.com/tonioloewald/tosijs-coding-practices** — and, when checked out beside
> this repo, at [`../tosijs-coding-practices`](../tosijs-coding-practices/README.md). Read that
> index first for the cross-project defaults (development, testing, code quality, performance,
> review, releasing, deployment, and the **observant** tosijs stack). This file records only
> what is **specific to or divergent from** those defaults — when they conflict, this file wins.
>
> Those docs are **living, not graven in stone.** Don't rewrite them unprompted, but do speak up:
> voice concerns, flag inconsistencies, and suggest improvements as you work.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`tosijs-timezone-picker` is a single web-component: an interactive SVG world map plus
offset-aware autocomplete, published on npm and documented at
[timezones.tosijs.net](https://timezones.tosijs.net). It is a **leaf** — nothing else in the
ecosystem consumes it — but it *is* a published library, so the consumer-protecting practices
(semver, changelog, backward compatibility) still apply.

The component ships in two shapes from one implementation:

- **`src/blueprint.ts`** — the whole component as a pure tosijs
  [`XinBlueprint`](https://tosijs.net/blueprint-loader/): a function that receives tosijs and
  returns a class. It imports **no tosijs code** (only types), so `dist/blueprint.js` is
  self-contained and loadable from a CDN by `<tosi-blueprint>` under any tag the consumer picks.
- **`src/timezone-picker.ts`** — hydrates that blueprint once, synchronously, against the
  statically-imported tosijs and registers `<tosijs-timezone-picker>`. It deliberately does
  **not** use `makeComponent()`: that is async, and awaiting it would turn `TimezonePicker` /
  `timezonePicker` into promises — a breaking change for every consumer.

Adding a feature means editing the blueprint. Only registration lives in `timezone-picker.ts`.

## Commands

```bash
bun install
bun start                    # build, then the doc-site dev server (bin/site.ts) on :8790
bun run build                # build doc site + library, then exit
bun test                     # all tests
bun test src/polygons.test.ts   # one file
bun tsc --noEmit             # typecheck — the build does NOT fail on type errors
bun run tls                  # one-time: dev-server TLS certs (needs mkcert + sudo)
```

`bin/site.ts` is the **only** build entry (tosijs-ui/site `buildSite`/`devServer` + a
`buildLibrary()` that shells out to the `bun build` CLI). Don't add side-channel build
scripts. `tsc` runs with `.nothrow()` to emit declarations, so type errors degrade the `.d.ts`
silently — run `bun tsc --noEmit` before calling a change done.

## Things that are easy to get wrong

- **Region offsets are derived, not stored.** The literals in `src/regions.ts` carry only
  `timezone`, `country`, `points`, `abbr`. A trailing `.map()` resolves each through
  `zoneFromRegion` and stamps the *current* offset from `Intl`, dropping (with a
  `console.warn`) any region whose zone can't be resolved. Offsets therefore move with DST,
  and `regions.length` depends on the runtime's `Intl` data.
- **`regions.test.ts` asserts an exact count (448).** Editing region data means updating that
  assertion.
- **A `NaN` offset is silent poison.** Nothing compares equal to `NaN`, so a region with one is
  orphaned from every offset band: no highlight, and keyboard navigation into that band would
  throw. `zoneOffset()` handles `:45` zones for this reason (Nepal +5:45, Chatham +12:45), and
  both a test and a `Number.isFinite` filter guard it.
- **`value` and `timezone` are one selection behind two properties.** `value` is tosijs's
  change-firing property; `timezone` is the attribute. `validate()` reconciles them in
  `render()` using the private `synced` field to tell which one moved; `connectedCallback()`
  does the initial reconcile *before* `super.connectedCallback()` so it can't fire a spurious
  `change`.
- **`super.connectedCallback()` renders before the map exists**, so that pass paints nothing —
  hence the explicit `this.render()` at the end of `connectedCallback`. Remove it and the
  initial selection is invisible until something else triggers a render.
- **Templates are cloned per instance.** The SVG map and the `<datalist>` options are built
  once and `cloneNode`d. Sharing an actual node between instances (as an earlier version did
  with the datalist) silently steals it from every picker but the last one on the page.
- **`timezoneAliases`** maps deprecated ⇄ current IANA names, because runtimes disagree about
  which name they list and the region data uses both. Entries must agree on *offset* — there is
  a test for it (that test caught `America/Coral_Harbour` pointing at Edmonton).
- **`list` is a readonly property on `HTMLInputElement`**, so the datalist link has to be set
  with `setAttribute`, not through the element spec.

## Doc site

- Pages come from `/*# … */` doc comments in `src/` plus `README.md` (the home page); config in
  `tosijs-timezone-picker-site.config.ts`; hydration bundle in `demo/site.ts`.
- **🚨 Live examples do not hydrate in a background tab, and nothing errors.** The page
  serves, the bundle loads, the custom elements register — and the examples stay unbuilt
  until the tab is foregrounded (Chrome throttles the callbacks the doc-system builds them
  on). A screenshot or `querySelector` against an unfocused tab reports an empty page, so
  an agent driving a browser will "confirm" a bug that isn't there and then "fix" whatever
  it touched last. **Focus the tab, wait, and re-measure before believing a doc page is
  broken** — and prefer measuring (`getBoundingClientRect`, element counts) over eyeballing
  a downscaled screenshot, where the light default map colours wash out to white.
- Only ` ```html `, ` ```css `, ` ```js `, ` ```test ` fences run; consecutive tagged fences
  group into one example. Use ` ```typescript ` or an indented block for illustrative code —
  in particular, the `<tosi-blueprint src="https://cdn.jsdelivr.net/…">` snippet must stay
  non-live so the docs don't fetch from a CDN.
- `src/docs/*.md` (the section pages) are generated on first build and then hand-editable;
  their `<!-- toc -->` blocks are regenerated every build.

## Build outputs

| path | what | committed |
| --- | --- | --- |
| `dist/index.js` + `.d.ts` | ESM, tosijs external — the npm entry | yes |
| `dist/blueprint.js` | self-contained ESM blueprint (`tosijs-timezone-picker/blueprint`) | yes |
| `cdn/index.js` | minified ESM — the long-standing CDN path, kept for compatibility | yes |
| `docs/` | the doc site, served from `main` `/docs` at timezones.tosijs.net | yes |
| `dist/iife.js`, `dist/hydrate/` | doc-site bundle scratch — gitignored | no |

`package.json`'s `files` list is explicit for that reason: `/dist` wholesale would publish a
1.1MB doc-site bundle.

## Key details

- Runtime is **Bun**; `tosijs` is a peer dependency (mirrored in devDependencies), `tosijs-ui`
  is a build-time devDep for the doc system only — it is never in the shipped bundle.
- Tests run under **happy-dom** (`bunfig.toml` preloads `happydom.ts`) so the component can be
  mounted for real; tosijs renders on `requestAnimationFrame`, so component tests await frames
  rather than `updates()`.
