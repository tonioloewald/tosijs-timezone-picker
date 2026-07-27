/*{ "parent": "components", "order": 1, "description": "The timezone-picker itself: an interactive SVG world map plus offset-aware autocomplete, shipped as a tosijs blueprint." }*/
/*#
# `<tosijs-timezone-picker>`

A graphical timezone picker inspired by Apple's, in about 30kB of geometry and no
timezone dataset at all — the zones come from [`Intl`](/timezones/) at runtime.

Click a region, arrow-key around the map, or type into the field: the field autocompletes
on **both** the zone name and the GMT offset, so `Los` and `-7` both get you to
`America/Los_Angeles`. `value` and `timezone` always hold a valid IANA timezone name.

```html
<tosijs-timezone-picker timezone="Australia/Sydney"></tosijs-timezone-picker>
```
```css
tosijs-timezone-picker {
  width: 100%;
  height: 100%;
}
```

## Reading the value

The element fires `change` when the user picks a zone — from the map, the keyboard, or the
text field.

```html
<tosijs-timezone-picker id="picker"></tosijs-timezone-picker>
<div class="readout">—</div>
```
```css
tosijs-timezone-picker {
  width: 100%;
  height: 100%;
}

.readout {
  font-family: monospace;
  padding: 10px 10px 40px;
}
```
```js
const picker = preview.querySelector('#picker')
const readout = preview.querySelector('.readout')

const show = () => {
  const { name, abbr, offset } = picker.zone
  readout.textContent = `${name} — ${abbr} (GMT${offset > 0 ? '+' : ''}${offset || ''})`
}

picker.addEventListener('change', show)
show()
```

## Attributes & properties

| | |
| --- | --- |
| `timezone` | attribute + property — the IANA name, e.g. `'Europe/Berlin'`. Defaults to the local zone. |
| `value` | property — kept in lock-step with `timezone`; setting either fires `change`. |
| `zone` | read-only [`Timezone`](/timezones/) — `{ name, abbr, offset }`. |
| `region` | read-only `Region` — the map region backing the current zone, if any. |

Assigning a name the runtime doesn't know is rejected: the element keeps the last zone the
two properties agreed on and warns, rather than landing in a state its own render can't
survive. "Doesn't know" is decided by `Intl.DateTimeFormat`, not by
`Intl.supportedValuesOf('timeZone')` — engines list only one half of a renamed pair while
accepting both, so a stored `'Europe/Kyiv'` keeps working on an engine that only lists
`'Europe/Kiev'`, and vice versa. See [timezones](/timezones/).

## Styling

Everything is a CSS custom property, so you can theme the picker from outside the shadow
DOM. The element is 500×250 at `--scale: 1`; set `width`/`height` (or `--scale`) to resize
it — the map keeps its aspect ratio inside whatever box you give it.

```html
<tosijs-timezone-picker class="lava"></tosijs-timezone-picker>
```
```css
.lava {
  --map-ocean: #1d1f2b;
  --map-land: #4a4458;
  --hover-color: #7a6a9a;
  --active-zone-color: #b4456f;
  --active-color: #ee257b;
  --font-color: white;
  --input-bg: #0006;
  --tooltip-bg: #ee257bee;
}
```

| variable | what it does |
| --- | --- |
| `--scale` | scales the whole map (default `1` → 500×250); or set `width`/`height` directly |
| `--map-ocean`, `--map-land` | base map colors |
| `--hover-color`, `--hover-target-color` | the hovered offset band, and the region under the pointer |
| `--active-zone-color`, `--active-color` | the selected offset band, and the selected region |
| `--focus-color` | keyboard-focus ring on the map |
| `--transition` | region color transition |
| `--tooltip-bg`, `--tooltip-color`, `--tooltip-font-size` | the hover/keyboard tooltip |
| `--inset`, `--padding`, `--input-bg`, `--input-radius` | position and shape of the text field |
| `--font-size`, `--font-color`, `--font-family` | the text field's type |

The `map`, `tooltip`, `zoneName` and `liveRegion` shadow parts are exposed for anything
custom properties can't reach:

```css
tosijs-timezone-picker::part(zoneName) { letter-spacing: 0.05em; }
```

## Keyboard & assistive tech

The map is focusable. **←/→** step one GMT offset west/east (keeping roughly the same
latitude), **↑/↓** move between zones within the current offset, north to south. Each move
announces the zone through a visually-hidden `aria-live` region and shows the same tooltip
the mouse does.

## Consuming it as a blueprint

The component is written as a [tosijs blueprint](https://tosijs.net/blueprint-loader/) — a
pure function that receives tosijs and returns a component class. That means it carries no
copy of tosijs, and **you** choose the tag name, so two versions can coexist on one page:

    <tosi-loader>
      <tosi-blueprint
        tag="my-timezone-picker"
        src="https://cdn.jsdelivr.net/npm/tosijs-timezone-picker/dist/blueprint.js"
      ></tosi-blueprint>
    </tosi-loader>
    <my-timezone-picker></my-timezone-picker>

…or, if you are already bundling:

```typescript
import { makeComponent } from 'tosijs'
import blueprint from 'tosijs-timezone-picker/blueprint'

const { creator } = await makeComponent('my-timezone-picker', blueprint)
document.body.append(creator())
```

Importing the package normally does exactly this for you, with the tag
`<tosijs-timezone-picker>`.
*/

/*
Eager registration of `<tosijs-timezone-picker>`.

The component itself lives in `blueprint.ts` as a pure `XinBlueprint` — a function that
receives tosijs and returns a class — so it can also be loaded from a CDN at runtime by
`<tosi-blueprint>`. This module is the other shipping shape: it hydrates that blueprint
once, synchronously, against the statically-imported tosijs, so
`import 'tosijs-timezone-picker'` still just registers the element.

`makeComponent()` is deliberately NOT used here: it is async, and awaiting it would turn
`TimezonePicker` / `timezonePicker` into promises — a breaking change for every consumer.
It builds the same class; only the timing differs.
*/

import { Component, elements, varDefault, XinFactory } from 'tosijs'
import {
  makeTimezonePickerClass,
  TimezonePickerConstructor,
  TimezonePickerElement,
  TimezonePickerParts,
} from './blueprint'

export type { TimezonePickerElement, TimezonePickerParts }

export const TAG_NAME = 'tosijs-timezone-picker'

// The blueprint only reaches for these three; the rest of XinFactory would be dead weight
// in the bundle (and `boxedProxy` is deprecated).
const factory = { Component, elements, varDefault } as unknown as XinFactory

export const TimezonePicker: TimezonePickerConstructor =
  makeTimezonePickerClass(factory)
TimezonePicker.preferredTagName = TAG_NAME

export const timezonePicker = TimezonePicker.elementCreator()
