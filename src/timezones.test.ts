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
