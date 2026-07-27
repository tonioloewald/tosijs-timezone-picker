/*{ "parent": "reference", "description": "The Intl-derived timezone list: Timezone, timezones, localTimezone, and the name/id lookup helpers." }*/
/*#
# timezones

`<tosijs-timezone-picker>` carries **no static timezone dataset**. The list is built at
import time from the
[`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
global, so it costs almost nothing to ship and always agrees with the runtime it is
running in — including the current DST state.

This is the whole dataset, live, in your browser right now — no download involved:

```js
const local = Intl.DateTimeFormat().resolvedOptions().timeZone
const zones = Intl.supportedValuesOf('timeZone')

preview.textContent =
  `Intl offers this browser ${zones.length} timezones, and says you are in ${local}.`
```

## `Timezone`

```typescript
interface Timezone {
  name: string       // the IANA name, e.g. 'America/Los_Angeles'
  shortName?: string // 'America/Los_Angeles' has none; 'America/Indiana/Knox' → 'America/Knox'
  abbr: string       // the runtime's short name, e.g. 'PDT'
  offset: number     // hours from GMT, e.g. -7 (fractional offsets are decimals: 5.5, -3.5)
}
```

`offset` is **the offset right now**, not the zone's standard offset — half the world's
zones move by an hour twice a year and the map moves with them.

## Exports

- **`timezones: Timezone[]`** — every zone `Intl.supportedValuesOf('timeZone')` reports.
- **`localTimezone: Timezone`** — the runtime's own zone, resolved through
  [`timezoneAliases`](#timezone-aliases) and falling back to `UTC` if the runtime reports a
  zone it doesn't otherwise list.
- **`zoneFromName(name)`** — look up by IANA name, `shortName`, or deprecated alias.
- **`zoneId(zone)`** — the human-readable id shown in the picker's text field, e.g.
  `'America/Los Angeles GMT-7'`.
- **`zoneFromId(id)`** — the inverse of `zoneId`.

## Timezone aliases

IANA renames zones (`Europe/Kiev` → `Europe/Kyiv`, `Asia/Calcutta` → `Asia/Kolkata`) and
runtimes disagree about which name they report. `timezoneAliases` maps the pairs both
ways so a zone named either way still finds its region on the map — see
[regions](/regions/).
*/

const timeNow = new Date()

export interface Timezone {
  name: string
  shortName?: string
  abbr: string
  offset: number
}

// 'GMT' → 0, 'GMT+5' → 5, 'GMT-3:30' → -3.5, 'GMT+5:45' → 5.75.
// (Quarter-hour zones are real: Nepal is +5:45, Chatham +12:45, Eucla +8:45.)
const zoneOffset = (name: string): number => {
  const formatted = Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'shortOffset',
    timeZone: name,
  }).format(timeNow)
  const parsed = formatted.match(/GMT([+-])(\d+)(?::(\d+))?/)
  if (parsed === null) {
    return 0
  }
  const [, sign, hours, minutes] = parsed
  const offset = Number(hours) + Number(minutes ?? 0) / 60
  return sign === '-' ? -offset : offset
}

const zoneAbbr = (name: string): string =>
  Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: name,
  })
    .format(timeNow)
    .split(' ')
    .pop() as string

export const timezones: Timezone[] = Intl.supportedValuesOf('timeZone').map(
  (name: string): Timezone => {
    const tz: Timezone = {
      name,
      abbr: zoneAbbr(name),
      offset: zoneOffset(name),
    }

    const parts = name.split('/')
    if (parts.length === 3) {
      tz.shortName = `${parts[0]}/${parts[2]}`
    }

    return tz
  }
)

/** Map between deprecated and current IANA timezone names. */
export const timezoneAliases: Record<string, string> = {
  'Africa/Asmera': 'Africa/Asmara',
  'Africa/Asmara': 'Africa/Asmera',
  // tzdb links Coral_Harbour to Panama (EST, no DST) — NOT to Edmonton, which is an
  // hour further west and observes DST
  'America/Coral_Harbour': 'America/Panama',
  'America/Godthab': 'America/Nuuk',
  'America/Nuuk': 'America/Godthab',
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Kolkata': 'Asia/Calcutta',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Kathmandu': 'Asia/Katmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Yangon': 'Asia/Rangoon',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Ho_Chi_Minh': 'Asia/Saigon',
  'Europe/Kiev': 'Europe/Kyiv',
  'Europe/Kyiv': 'Europe/Kiev',
  'Europe/Uzhgorod': 'Europe/Kiev',
  'Europe/Zaporozhye': 'Europe/Kiev',
  'America/Montreal': 'America/Toronto',
  'America/Nipigon': 'America/Toronto',
  'America/Pangnirtung': 'America/Iqaluit',
  'America/Rainy_River': 'America/Winnipeg',
  'America/Santa_Isabel': 'America/Tijuana',
  'America/Thunder_Bay': 'America/Toronto',
  'America/Yellowknife': 'America/Edmonton',
  'Asia/Choibalsan': 'Asia/Ulaanbaatar',
  'Australia/Currie': 'Australia/Hobart',
  'Pacific/Johnston': 'Pacific/Honolulu',
}

export const zoneFromName = (name: string): Timezone | undefined =>
  timezones.find((tz) => tz.name === name || tz.shortName === name) ??
  timezones.find((tz) => tz.name === timezoneAliases[name])

export const zoneId = (tz: Timezone): string => {
  const name = tz.shortName !== undefined ? tz.shortName : tz.name
  const { offset } = tz
  const signedOffset = offset > 0 ? `+${offset}` : offset < 0 ? String(offset) : ''
  return `${name.replace(/_/g, ' ')} GMT${signedOffset}`
}

export const zoneFromId = (id: string): Timezone | undefined =>
  timezones.find((tz) => id === zoneId(tz))

// A runtime can report a zone that isn't in supportedValuesOf() (typically a deprecated
// alias), so resolve through the alias table and fall back rather than leaving
// localTimezone undefined — every default in the component reads it.
export const localTimezone: Timezone =
  zoneFromName(Intl.DateTimeFormat().resolvedOptions().timeZone) ??
  zoneFromName('UTC') ??
  timezones[0]
