/* eslint-disable */
import { test, expect } from 'bun:test'
import { regions, zoneFromRegion } from './regions'
import { area, stringToPolygon } from './polygons'

test('regions loads', () => {
  expect(regions === undefined).toBe(false)
  expect(Array.isArray(regions)).toBe(true)
  expect(regions.length).toBe(448)
})

test('no region has a degenerate polygon', () => {
  expect(regions.find(rg => area(...stringToPolygon(rg.points)) < 2)).toBe(undefined)
  expect(regions.find(rg => stringToPolygon(rg.points).length < 4)).toBe(undefined)
})

test('no region has a non-existent zone', () => {
  expect(regions.find(rg => zoneFromRegion(rg) === undefined)).toBe(undefined)
})