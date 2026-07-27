import { test, expect } from 'bun:test'
import { regions, regionId, zoneFromRegion } from './regions'
import { area, stringToPolygon } from './polygons'

test('regions loads', () => {
  expect(regions === undefined).toBe(false)
  expect(Array.isArray(regions)).toBe(true)
  expect(regions.length).toBe(448)
})

test('no region has a degenerate polygon', () => {
  expect(regions.find((rg) => area(...stringToPolygon(rg.points)) < 2)).toBe(undefined)
  expect(regions.find((rg) => stringToPolygon(rg.points).length < 4)).toBe(undefined)
})

test('no region has a non-existent zone', () => {
  expect(regions.find((rg) => zoneFromRegion(rg) === undefined)).toBe(undefined)
})

// Offsets are attached at import time from Intl; a NaN offset silently orphans a region
// from its offset band (nothing equals NaN), which breaks map highlighting and keyboard
// navigation with no error anywhere.
test('every region has a usable offset', () => {
  const broken = regions.filter((rg) => !Number.isFinite(rg.offset))
  expect(broken).toEqual([])
})

test('every polygon fits the 500x250 map', () => {
  const outside = regions.filter((rg) =>
    stringToPolygon(rg.points).some(({ x, y }) => x < 0 || x > 500 || y < 0 || y > 250)
  )
  expect(outside).toEqual([])
})

test('regionId spells out the zone and offset', () => {
  const sydney = regions.find((rg) => rg.timezone === 'Australia/Sydney')!
  expect(regionId(sydney)).toBe(`Australia/Sydney GMT+${sydney.offset}`)
})
