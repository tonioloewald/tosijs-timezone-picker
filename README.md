# tosijs-timezone-picker

<!--{ "headTitle": "tosijs-timezone-picker — a graphical timezone picker web-component", "description": "A lightweight, mobile-friendly timezone-picker web-component: an interactive SVG world map plus offset-aware autocomplete, with no timezone dataset to ship.", "keywords": [ "timezone", "web-component", "tosijs", "picker", "Intl" ] }-->

[demo](https://timezones.tosijs.net/) | [github](https://github.com/tonioloewald/tosijs-timezone-picker#readme) | [npm](https://www.npmjs.com/package/tosijs-timezone-picker) | ![bundlejs](https://deno.bundlejs.com/?q=tosijs-timezone-picker&badge=)

A [web-component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) that
provides a graphical timezone picker, inspired by Apple's. Click the map, arrow-key around
it, or type — the field autocompletes on the timezone name **and** the GMT offset, so `Los`
and `-7` both get you to `America/Los_Angeles`.

```html
<tosijs-timezone-picker></tosijs-timezone-picker>
```
```css
tosijs-timezone-picker {
  --scale: 0.9;
  --active-color: #ee257b;
  --active-zone-color: #f273aa;
  --map-land: #aaa;
  --map-ocean: #ccd;
  --font-color: black;
}
```

It is made as compact and fast-loading as possible by keeping the geometry to a minimum,
taking everything it can from [`Intl`](/timezones/) at runtime, and generating the SVG
on-the-fly. There is no timezone dataset in the package, and no network request at all.

## Install

```bash
bun add tosijs-timezone-picker      # or npm / yarn / pnpm
```

`tosijs` is a peer dependency, so your app ships exactly one copy of it.

## Use it

### As an element

```typescript
import 'tosijs-timezone-picker'
```

    <tosijs-timezone-picker timezone="Australia/Sydney"></tosijs-timezone-picker>

### Programmatically

```typescript
import { timezonePicker } from 'tosijs-timezone-picker'

document.body.append(timezonePicker({ timezone: 'Europe/Rome' }))
```

`timezonePicker` is a standard tosijs `ElementCreator` — a function that takes
`ElementPart` parameters and returns the element. `TimezonePicker`, the class behind
the tag, is exported too.

### From a CDN, with your own tag name

The component is written as a [tosijs blueprint](https://tosijs.net/blueprint-loader/), so
it can be loaded at runtime with no build step — and the *consumer* picks the tag name:

    <script type="module" src="https://cdn.jsdelivr.net/npm/tosijs/dist/module.js"></script>
    <tosi-loader>
      <tosi-blueprint
        tag="my-timezone-picker"
        src="https://cdn.jsdelivr.net/npm/tosijs-timezone-picker/dist/blueprint.js"
      ></tosi-blueprint>
    </tosi-loader>
    <my-timezone-picker></my-timezone-picker>

## The value

`value` and `timezone` are two names for one thing, and both always hold a **valid IANA
timezone name**. Setting either updates the other and fires `change`; setting a name the
runtime doesn't know is rejected rather than accepted into an impossible state.

Full attribute, property, styling and keyboard reference:
[`<tosijs-timezone-picker>`](/timezone-picker/).

## timezones, localTimezone, Timezone

Rather than shipping a static dataset, this package builds its zone list from
[`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
at import time. That keeps the component small *and* guarantees it agrees with the runtime
it is running in — including the current DST state. See [timezones](/timezones/).

```typescript
interface Timezone {
  name: string       // the IANA name
  shortName?: string // e.g. 'America/Knox' for 'America/Indiana/Knox'
  abbr: string       // the runtime's short name, e.g. 'PDT'
  offset: number     // hours from GMT — fractional zones are decimals (5.5, 5.75, -3.5)
}
```

## Styling

Everything is a CSS custom property, so you can theme the picker from outside its shadow
DOM without `::part` gymnastics — `--scale`, `--map-ocean`, `--map-land`, `--active-color`,
`--tooltip-bg` and the rest are listed on the [component page](/timezone-picker/).

## Annoyances

The text field uses the browser's built-in `<datalist>` autocomplete. Most people will
never type a zone name, but for those who do, its behavior is entirely the browser's:
Firefox and Safari are lovely, Chrome's menu jumps around as you type. Swapping in
tosijs-ui's editable `<tosi-select>` would fix it and roughly double the component's size,
so it stays as it is.

## Acknowledgements

Built on region data from Keval Bhatt's excellent jQuery-based
[timezone-picker](https://github.com/kevalbhatt/timezone-picker). These things are a huge
pain to get right — an SVG map I had paid for got binned in favour of Keval's data. Bravo!

To improve the geometry, [IANA's page](https://data.iana.org/time-zones/tz-link.html) is
the place to start: there are tools that build GeoJSON timezone layers, and a fairly simple
transformation would give exactly correct polygons. The `polygons` module could then
simplify them — the raw GeoJSON is over 100MB.

## License

MIT. Copyright ©2023-2026 Tonio Loewald.
