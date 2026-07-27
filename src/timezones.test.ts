import { test, expect } from 'bun:test'
import {
  timezones,
  timezoneAliases,
  localTimezone,
  zoneFromName,
  zoneFromId,
  zoneId,
} from './timezones'

test('timezones loads', () => {
  expect(timezones === undefined).toBe(false)
  expect(Array.isArray(timezones)).toBe(true)
})

test('over 400 timezones', () => {
  expect(timezones.length > 400).toBe(true)
})

test('zoneFromName works', () => {
  expect([-2.5, -3.5].includes(zoneFromName('America/St_Johns')?.offset as number)).toBe(true)
  expect([-6, -7].includes(zoneFromName('America/Los_Angeles')?.offset as number)).toBe(true)
  expect([10, 11].includes(zoneFromName('Australia/Sydney')?.offset as number)).toBe(true)
  expect([0, 1].includes(zoneFromName('Europe/London')?.offset as number)).toBe(true)
})

// Runtimes disagree about which name they list, so the contract isn't "returns the new
// name" — it's that neither name is a dead end (the region data uses both).
test('zoneFromName resolves every deprecated alias', () => {
  const unresolved = Object.keys(timezoneAliases).filter(
    (name) => zoneFromName(name) === undefined
  )
  expect(unresolved).toEqual([])
})

test('aliases agree with the zone they alias', () => {
  const disagreeing = Object.entries(timezoneAliases).filter(([from, to]) => {
    const a = zoneFromName(from)
    const b = zoneFromName(to)
    return a !== undefined && b !== undefined && a.offset !== b.offset
  })
  expect(disagreeing).toEqual([])
})

test('zoneFromName rejects nonsense', () => {
  expect(zoneFromName('Nowhere/Nothing')).toBe(undefined)
})

// every default in the component reads localTimezone, so an undefined one is fatal
test('localTimezone is a real zone', () => {
  expect(localTimezone === undefined).toBe(false)
  expect(zoneFromName(localTimezone.name)?.name).toBe(localTimezone.name)
})

test('zoneId and zoneFromId round-trip every zone', () => {
  const broken = timezones.filter((tz) => zoneFromId(zoneId(tz)) === undefined)
  expect(broken).toEqual([])
})

test('zoneId spells out the offset', () => {
  const la = zoneFromName('America/Los_Angeles')!
  expect(zoneId(la)).toBe(`America/Los Angeles GMT${la.offset}`)
  expect(zoneId(zoneFromName('UTC')!)).toBe('UTC GMT')
})

// supportedValuesOf() and DateTimeFormat disagree about what exists: engines list one half
// of a rename and accept both. Anything the runtime will format must resolve, or an app
// holding a stored zone name breaks when IANA retires it.
test('zoneFromName accepts names Intl formats but does not list', () => {
  const listed = new Set(timezones.map((tz) => tz.name))
  const unlisted = ['US/Pacific', 'Asia/Chongqing', 'Etc/GMT+5'].filter(
    (name) => !listed.has(name)
  )
  for (const name of unlisted) {
    const zone = zoneFromName(name)
    expect(zone === undefined ? name : zone.name).toBe(name)
    expect(Number.isFinite(zone!.offset)).toBe(true)
  }
})

test('both halves of a renamed pair resolve, whichever one the engine lists', () => {
  for (const pair of [
    ['Europe/Kiev', 'Europe/Kyiv'],
    ['Asia/Calcutta', 'Asia/Kolkata'],
    ['Asia/Rangoon', 'Asia/Yangon'],
    ['America/Godthab', 'America/Nuuk'],
  ]) {
    const zones = pair.map((name) => zoneFromName(name))
    expect(zones.filter((z) => z === undefined)).toEqual([])
    expect(zones[0]!.offset).toBe(zones[1]!.offset)
  }
})
