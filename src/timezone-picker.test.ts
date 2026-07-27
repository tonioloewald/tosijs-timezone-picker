import { test, expect, afterEach } from 'bun:test'
import { timezonePicker, TimezonePicker, TAG_NAME } from './timezone-picker'
import type { TimezonePickerElement } from './blueprint'
import { localTimezone } from './timezones'
import { regions } from './regions'

const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()))

/** tosijs renders on rAF, and reconciling value/timezone can take a second pass */
const settled = async (): Promise<void> => {
  await frame()
  await frame()
  await frame()
}

const mount = (...args: Parameters<typeof timezonePicker>): TimezonePickerElement => {
  const picker = timezonePicker(...args) as TimezonePickerElement
  document.body.append(picker)
  return picker
}

afterEach(() => {
  document.body.innerHTML = ''
})

test('the element registers itself under the expected tag', () => {
  expect(TimezonePicker.preferredTagName).toBe(TAG_NAME)
  expect(customElements.get(TAG_NAME) === undefined).toBe(false)
})

test('it defaults to the local timezone', async () => {
  const picker = mount()
  await settled()
  expect(picker.timezone).toBe(localTimezone.name)
  expect(picker.value).toBe(localTimezone.name)
  expect(picker.zone.name).toBe(localTimezone.name)
})

test('the timezone attribute selects a zone', async () => {
  const picker = mount({ timezone: 'Australia/Sydney' })
  await settled()
  expect(picker.timezone).toBe('Australia/Sydney')
  expect(picker.zone.name).toBe('Australia/Sydney')
  expect(picker.region?.timezone).toBe('Australia/Sydney')
})

// Regression: `value` is a plain field, so it used to stay on the local zone while the
// timezone attribute moved the map — the element reported a selection nobody made.
test('value follows timezone, and timezone follows value', async () => {
  const picker = mount({ timezone: 'Europe/Berlin' })
  await settled()
  expect(picker.value).toBe('Europe/Berlin')

  picker.value = 'Asia/Tokyo'
  await settled()
  expect(picker.timezone).toBe('Asia/Tokyo')

  picker.timezone = 'America/Denver'
  await settled()
  expect(picker.value).toBe('America/Denver')

  picker.setAttribute('timezone', 'Pacific/Auckland')
  await settled()
  expect(picker.value).toBe('Pacific/Auckland')
})

test('a preset value wins when no timezone attribute is given', async () => {
  const picker = mount({ value: 'Asia/Seoul' })
  await settled()
  expect(picker.timezone).toBe('Asia/Seoul')
})

test('an unknown value reverts rather than sticking', async () => {
  const picker = mount({ timezone: 'Europe/Berlin' })
  await settled()
  picker.value = 'Mordor/Barad-dur'
  await settled()
  expect(picker.value).toBe('Europe/Berlin')
  expect(picker.timezone).toBe('Europe/Berlin')
})

test('selecting a zone does not fire change before the user touches it', async () => {
  const picker = mount({ timezone: 'Europe/Berlin' })
  let changes = 0
  picker.addEventListener('change', () => changes++)
  await settled()
  expect(changes).toBe(0)
})

test('the map draws one polygon per region', async () => {
  const picker = mount()
  await settled()
  const map = picker.shadowRoot!.querySelector('.map')!
  expect(map.querySelectorAll('polygon').length).toBe(regions.length)
})

// Regression: the datalist used to be a single module-level node, so a second picker on
// the page stole it from the first and left it with no autocomplete at all.
test('every instance gets its own populated datalist', async () => {
  const first = mount()
  const second = mount()
  await settled()
  for (const picker of [first, second]) {
    const list = picker.shadowRoot!.querySelector('datalist')!
    expect(list.querySelectorAll('option').length > 400).toBe(true)
    expect(picker.shadowRoot!.querySelector('input')!.getAttribute('list')).toBe(list.id)
  }
})

// The blueprint is the other half of what we ship: it must survive tosijs's own
// makeComponent(), under a tag the consumer chose.
test('the blueprint hydrates through makeComponent under any tag', async () => {
  const { makeComponent } = await import('tosijs')
  const { default: blueprint } = await import('./blueprint')
  const { type, creator } = await makeComponent('my-own-timezone-picker', blueprint)
  const picker = creator({ timezone: 'Asia/Tokyo' }) as TimezonePickerElement
  document.body.append(picker)
  await settled()
  expect(customElements.get('my-own-timezone-picker') === (type as unknown)).toBe(true)
  expect(picker.tagName.toLowerCase()).toBe('my-own-timezone-picker')
  expect(picker.value).toBe('Asia/Tokyo')
  expect(picker.shadowRoot!.querySelectorAll('polygon').length).toBe(regions.length)
})

// A zone name IANA has retired (or one the engine simply refuses) must not put the element
// in a state its own render can't survive — this used to throw out of zoneId() on every
// frame, from a property assignment or a setAttribute.
test('an unknown timezone falls back instead of throwing', async () => {
  const picker = mount({ timezone: 'Asia/Tokyo' })
  await settled()

  const warnings: unknown[] = []
  const warn = console.warn
  console.warn = (...args: unknown[]) => warnings.push(args[0])
  try {
    picker.timezone = 'Mordor/Barad-dur'
    await settled()
    expect(picker.timezone).toBe('Asia/Tokyo')
    expect(picker.value).toBe('Asia/Tokyo')

    picker.setAttribute('timezone', 'Mordor/Barad-dur')
    await settled()
    expect(picker.timezone).toBe('Asia/Tokyo')
    expect(picker.zone.name).toBe('Asia/Tokyo')
  } finally {
    console.warn = warn
  }
  expect(warnings.length > 0).toBe(true)
})

test('a bogus timezone attribute at construction falls back to the local zone', async () => {
  const picker = mount({ timezone: 'Mordor/Barad-dur' })
  await settled()
  expect(picker.timezone).toBe(localTimezone.name)
  expect(picker.value).toBe(localTimezone.name)
})
