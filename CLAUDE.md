# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight, self-contained `<tosijs-timezone-picker>` web component built with [tosijs](https://tosijs.net) (formerly xinjs). Published on npm as `tosijs-timezone-picker`. Renders an interactive SVG world map where users can click regions or autocomplete by timezone name/GMT offset. Uses the `Intl` API at runtime to derive timezone data rather than static datasets.

## Commands

- **Dev server:** `bun start` (runs `bun --watch dev.ts`, serves demo at localhost:8777)
- **Build:** `bun run build` (runs `build.ts` — tests first, then builds dist/cdn/docs targets via Bun.build, generates .d.ts via tsc)
- **Test:** `bun test` (runs all `*.test.ts` files with Bun's test runner)
- **Run single test:** `bun test src/polygons.test.ts`

## Architecture

- **src/index.ts** — Public exports: `timezonePicker`, `TimezonePicker`, `timezones`, `localTimezone`, `regions`
- **src/timezone-picker.ts** — The `<tosijs-timezone-picker>` custom element (extends tosijs `Component`). Renders an SVG map from region polygon data, handles click/hover/autocomplete interactions. The `value` and `timezone` properties always hold a valid IANA timezone name. Uses `static shadowStyleSpec`, `static initAttributes`, `static preferredTagName`, and `this.parts` (tosijs modern API).
- **src/timezones.ts** — Builds the timezone list dynamically from `Intl.supportedValuesOf('timeZone')` and `Intl.DateTimeFormat`. Exports `timezones`, `localTimezone`, and lookup helpers (`zoneFromName`, `zoneFromId`, `zoneId`).
- **src/regions.ts** — Static polygon data mapping ~400 geographic regions to IANA timezone names. Each `Region` has SVG `points`, a `timezone` name, `country` code, and `offset`.
- **src/polygons.ts** — Geometry utilities for polygon simplification (used for cleaning up region data).
- **dev.ts** — Bun dev server with file watcher; builds src bundle to `www/` and serves `demo/index.html`
- **build.ts** — Production build script: runs tests, builds dist/cdn/docs via Bun.build, generates .d.ts via tsc

## Build Outputs

- **dist/** — ES module library build + type declarations (npm main entry, tosijs externalized)
- **cdn/** — Minified ES module library build (tosijs externalized)
- **docs/** — Demo page + bundled JS for GitHub Pages

## Key Details

- Runtime: **Bun** (for building, testing, dev server, and package management)
- Type declarations: **tsc** via `tsconfig.build.json` (declaration-only emit)
- Peer dependency on **tosijs** (not bundled)
- TypeScript source, ES module output
- Tests use `bun:test` (`test`, `expect` imports)
