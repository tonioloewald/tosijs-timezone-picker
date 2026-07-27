import { test, expect } from 'bun:test'
import { _area, area, simplify} from './polygons'

const a = {x: 0, y: 0}
const b = {x: 1, y: 4}
const c = {x: 4, y: 2}
const d = {x: 2, y: 2}
const e = {x: 3, y: 0}
const f = {x: 0.02, y: 0.02}

const r = {x: 0, y: 0}
const s = {x: 0, y: 1}
const t = {x: 1, y: 1}
const u = {x: 1, y: 0}
const v = {x: 0.25, y: 0.25}

test('_area works', () => {
  expect(_area(r, s)).toBe(0)
  expect(_area(s, t)).toBe(0.5)
  expect(_area(t, u)).toBe(0.5)
  expect(_area(s, u)).toBe(0.5)
  expect(_area(u, t)).toBe(-0.5)
  expect(_area(u, s)).toBe(-0.5)
  expect(_area(b, c)).toBe(7)
  expect(_area(c, b)).toBe(-7)
})

test('area works for triangles', () => {
  expect(area(r, r, s)).toBe(0)
  expect(area(r, s, t)).toBe(0.5)
  expect(area(r, t, u)).toBe(0.5)
  expect(area(r, s, u)).toBe(0.5)
  expect(area(r, u, t)).toBe(0.5)
  expect(area(r, u, s)).toBe(0.5)
  expect(area(a, b, c)).toBe(7)
  expect(area(a, c, b)).toBe(7)
})

test('area works for convex quads', () => {
  expect(area(r, s, t, u)).toBe(1)
  expect(area(s, t, u, r)).toBe(1)
  expect(area(u, r, s, t)).toBe(1)
  expect(area(t, s, r, u)).toBe(1)

  expect(area(s, v, u, t)).toBe(0.75)
  expect(area(u, v, s, t)).toBe(0.75)

  expect(area(a, b, c, e)).toBe(10)
  expect(area(e, c, b, a)).toBe(10)
  expect(area(b, c, e, a)).toBe(10)
  expect(area(c, b, a, e)).toBe(10)
})

test('area works for concave quads', () => {
  expect(area(r, s, v, u)).toBe(0.25)
  expect(area(v, s, r, u)).toBe(0.25)

  expect(area(a, b, c, d)).toBe(5)
  expect(area(c, b, a, d)).toBe(5)
})

test('area works for degenerate quads', () => {
  expect(area(c, c, c)).toBe(0)
  expect(area(b, c, c)).toBe(0)
  expect(area(s, t, u, t)).toBe(0)

  expect(area(d, e, c, b)).toBe(4)
  expect(area(c, e, d, b)).toBe(4)
})

test('simplify works', () => {
  expect(simplify([a, b, b, c]).length).toBe(3)
  expect(simplify([a, a, b, b, c, c]).length).toBe(3)
  expect(simplify([a, f, b, b, c, c]).length).toBe(3)
  expect(simplify([a, f, b, b, c, c], 0.001).length).toBe(4)
})