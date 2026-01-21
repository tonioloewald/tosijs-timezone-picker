# xinjs-timezone-picker

[demo](https://tonioloewald.github.io/xinjs-timezone-picker/) | [github](https://github.com/tonioloewald/xinjs-timezone-picker#readme) | [npm](https://www.npmjs.com/package/xinjs-timezone-picker) | ![bundlejs](https://deno.bundlejs.com/?q=xinjs-timezone-picker&badge=)

Copyright ©2023 Tonio Loewald

This is a [web-component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) 
that provides a graphical timezone-picker, inspired by Apple's graphical timezone-picker.

`<timezone-picker>` has been made as compact and fast-loading as possible, by keeping the geometry to a minimum,
using data provided by `Intl` where possible, and generating the underlying SVG
data on-the-fly.

The widget is designed so that the `value` of the `<timezone-picker>` element will always
be a valid IANA timezone name, and it supports both a graphical picker and `autocomplete`
based on the timezone name *and* the GMT offset, so you can get to "America/Los_Angeles"
by typing "Los" or "-7".

## Usage

### HTML

    import 'xinjs-timezone-picker'

And now you can use:

    <timezone-picker timezone="Australia/Sydney"></timezone-picker>

### Programmatically

    import { timezonePicker } from 'xin-timezone-picker'
    document.body.append(timezonePicker())

`timezonePicker` is a standard `xinjs` `ElementCreator`, i.e. a function that takes
`ElementPart` parameters and returns an `element` of the type expected.

You can also obtain TimezonePicker, the class constructor for `<timezone-picker>`.

### timezones, localTimezone, Timezone

Rather than using a static dataset of timezones, <timezone-picker> uses the 
[Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
Javascript global to build `timezones` and determine the `localTimezone`. This
both reduces the size of this component considerably and ensures it will match
the behavior of the runtime environment exactly.

These are respectively of type `Timezone[]` and a `Timezone`, where:

    interface Timezone {
      name: string    // the IANA name
      offset: number  // the offset from GMT in hours
      utc: string     // the timezone's UTC offset
    }

> Note that for some reason `parcel` is not recognizing that the `Timezone` interface is
> exported, so it's not exported.

## Styling

You can style the <timezone-picker> by using [CSS-Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables)

By default, the `<timezone-picker>` is 400px wide and 231px tall.

`--scale` scales the map as a whole.

`--map-ocean` and `--map-land` set the map colors.

`--active-color`, `--hover-opacity`, `--active-opacity` set the timezone colors.

`--hover-transition` controls the animated transition of the timezones.

`--inset`, `--padding`, `--input-bg`, `--input-radius`, position the timezone `<input>`.

`--font-size`, `--font-color`, and `--font-family` control the text of the `<input>`

## Annoyances

I'm using the built-in support for filtered autocomplete in the `<input>` field
where you type in the timezone manually. I figure most people simply won't use
this, but for those who do its behavior is highly dependent on the browser implementation.
E.g. Chrome is absolutely horrible (the menu jumps around randomly as you type) while
Firefox and Safari work beautifully.

Ideally I'd switch out the `<input>` field for `xinjs-ui`'s editable `<xin-select>`
(and implement filtering…) but that would increase the size of this component
significantly and really Chrome should fix it's shit.

## Acknowledgements

I've built on data I found in Keval Bhatt's excellent jQuery-based picker,
found here https://github.com/kevalbhatt/timezone-picker

These things are a huge pain-in-the-ass to get right, and I actually ditched
an SVG file I had paid to have built in favor of Keval's data. Bravo!

If you want to vastly improve this widget, a good place to start looking is
[IANA's web page](https://data.iana.org/time-zones/tz-link.html) which discusses
not only their data, but other sources, and links to tools to build your own.

Fundamentally, there are tools out there to build GeoJSON layers for timezones
and, combined with a fairly simple transformation (if you want to overlay one
a compressed projection vs. on, say, a mapbox view), would give you the exact
correct polygon data. The `polygons` module could then be used to simplify the
polygons (the raw GeoJSON data is over 100MB!).

This is the approach I'd take if someone were actually paying me for this…
