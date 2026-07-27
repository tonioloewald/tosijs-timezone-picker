/*{ "parent": "reference", "description": "What the tosijs-timezone-picker package exports." }*/
/*#
# exports

```typescript
import 'tosijs-timezone-picker'                      // registers <tosijs-timezone-picker>

import {
  timezonePicker,     // ElementCreator — timezonePicker({ timezone: 'Europe/Rome' })
  TimezonePicker,     // the component class
  TAG_NAME,           // 'tosijs-timezone-picker'
  blueprint,          // the XinBlueprint, for makeComponent()/<tosi-blueprint>
  timezones,          // Timezone[] — built from Intl at import time
  localTimezone,      // Timezone — the runtime's own zone
  zoneFromName,       // (name: string) => Timezone | undefined  (alias-aware)
  zoneFromId,         // (id: string) => Timezone | undefined
  zoneId,             // (zone: Timezone) => 'America/Los Angeles GMT-7'
  timezoneAliases,    // deprecated ⇄ current IANA names
  regions,            // Region[] — the map's polygons
  regionId,
  zoneFromRegion,
} from 'tosijs-timezone-picker'
```

Types: `Timezone`, `Region`, `TimezonePickerElement`, `TimezonePickerParts`.

The blueprint is also published on its own entry point, for consumers who want the
component without the eager `<tosijs-timezone-picker>` registration:

```typescript
import blueprint from 'tosijs-timezone-picker/blueprint'
```
*/

export {
  timezonePicker,
  TimezonePicker,
  TAG_NAME,
  type TimezonePickerElement,
  type TimezonePickerParts,
} from './timezone-picker'
export { default as blueprint, makeTimezonePickerClass } from './blueprint'
export {
  timezones,
  localTimezone,
  timezoneAliases,
  zoneFromName,
  zoneFromId,
  zoneId,
  type Timezone,
} from './timezones'
export { regions, regionId, zoneFromRegion, type Region } from './regions'
