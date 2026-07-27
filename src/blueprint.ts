/*
The component itself, as a pure tosijs `XinBlueprint`: a function that receives tosijs
and returns a component class, so this module imports no tosijs code of its own and can be
loaded straight from a CDN by <tosi-blueprint>. Its user-facing documentation lives with
the eager registration in `timezone-picker.ts`.
*/

import type {
  Component,
  ElementCreator,
  PartsMap,
  XinBlueprint,
  XinComponentSpec,
  XinFactory,
  XinStyleSheet,
} from 'tosijs'
import {
  localTimezone,
  timezones,
  Timezone,
  zoneId,
  zoneFromName,
  zoneFromId,
  timezoneAliases,
} from './timezones'
import { regions, Region, regionId, zoneFromRegion } from './regions'

const SVG_XMLNS = 'http://www.w3.org/2000/svg'
const DATALIST_ID = '-timezone-list-'
const TOOLTIP_ID = '-timezone-tooltip-'
const MAP_WIDTH = 500
const MAP_HEIGHT = 250

export interface TimezonePickerParts extends PartsMap {
  map: HTMLDivElement
  tooltip: HTMLSpanElement
  liveRegion: HTMLSpanElement
  zoneName: HTMLInputElement
}

/** The public instance API of `<tosijs-timezone-picker>`. */
export interface TimezonePickerElement extends Component<TimezonePickerParts> {
  /** the selected IANA timezone name — always valid */
  value: string
  /** the selected IANA timezone name (attribute-backed); kept in sync with `value` */
  timezone: string
  readonly zone: Timezone
  readonly region: Region | undefined
  readonly zoneId: string
}

export interface TimezonePickerConstructor {
  new (): TimezonePickerElement
  preferredTagName?: string
  initAttributes?: Record<string, any>
  shadowStyleSpec?: XinStyleSheet
  elementCreator(): ElementCreator<TimezonePickerElement>
}

// ── geometry, computed once per module load (not per component) ───────────────

/** centroid Y of a region's polygon (lower = further north in SVG coords) */
const regionCenterY = (region: Region): number => {
  const ys = region.points
    .split(',')
    .filter((_, i) => i % 2 === 1)
    .map(Number)
  return ys.reduce((a, b) => a + b, 0) / ys.length
}

/**
 * unique offsets, west to east — the ←/→ axis of keyboard navigation. Non-finite offsets
 * are dropped: nothing compares equal to NaN, so such a band would be permanently empty
 * and stepping into it would throw.
 */
const offsets = [...new Set(regions.map((r) => r.offset))]
  .filter((offset) => Number.isFinite(offset))
  .sort((a, b) => a - b)

/** one representative region per timezone per offset, north to south — the ↑/↓ axis */
const regionsByOffset = new Map<number, Region[]>()
for (const offset of offsets) {
  const seen = new Set<string>()
  const unique: Region[] = []
  for (const r of regions) {
    if (r.offset === offset && !seen.has(r.timezone)) {
      seen.add(r.timezone)
      unique.push(r)
    }
  }
  regionsByOffset.set(
    offset,
    unique.sort((a, b) => regionCenterY(a) - regionCenterY(b))
  )
}

const nearestByLatitude = (candidates: Region[], y: number): Region =>
  candidates.reduce((best, r) =>
    Math.abs(regionCenterY(r) - y) < Math.abs(regionCenterY(best) - y) ? r : best
  )

// ── the blueprint ────────────────────────────────────────────────────────────

/**
 * Builds the component class from an injected tosijs. Exported for the eager
 * `<tosijs-timezone-picker>` registration in `timezone-picker.ts`, which needs the class
 * synchronously; everyone else wants the `XinBlueprint` default export below.
 */
export const makeTimezonePickerClass = (
  module: XinFactory
): TimezonePickerConstructor => {
  const { Component, elements, varDefault } = module
  const { fragment, div, span, option, input, datalist } = elements

  // Which region a <polygon> stands for. A WeakMap rather than an expando so the
  // association is typed and dies with the element.
  const regionOfPolygon = new WeakMap<Element, Region>()

  // Both templates are built on first use and cloned per instance: ~450 polygons and
  // ~450 <option>s are slow to construct and identical every time. (The previous
  // version shared ONE datalist node between instances, which silently stole it from
  // every picker but the last one on the page.)
  let mapTemplate: SVGSVGElement | undefined
  let optionsTemplate: DocumentFragment | undefined

  const timezoneMap = (): SVGSVGElement => {
    if (mapTemplate === undefined) {
      mapTemplate = document.createElementNS(SVG_XMLNS, 'svg')
      mapTemplate.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
      mapTemplate.setAttribute('focusable', 'false')
      mapTemplate.append(
        ...regions.map((region) => {
          const polygon = document.createElementNS(SVG_XMLNS, 'polygon')
          polygon.setAttribute('points', region.points)
          return polygon
        })
      )
    }
    const svg = mapTemplate.cloneNode(true) as SVGSVGElement
    // regions and polygons are in the same order by construction
    const polygons = svg.querySelectorAll('polygon')
    for (let i = 0; i < polygons.length; i++) {
      regionOfPolygon.set(polygons[i], regions[i])
    }
    return svg
  }

  const timezoneOptions = (): DocumentFragment => {
    if (optionsTemplate === undefined) {
      optionsTemplate = document.createDocumentFragment()
      optionsTemplate.append(...timezones.map((tz) => option({ value: zoneId(tz) })))
    }
    return optionsTemplate.cloneNode(true) as DocumentFragment
  }

  class TimezonePicker extends Component<TimezonePickerParts> {
    value = localTimezone.name
    declare timezone: string

    static initAttributes = {
      timezone: localTimezone.name,
    }

    static shadowStyleSpec = {
      ':host': {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: `calc(${MAP_WIDTH}px * ${varDefault.scale(1)})`,
        height: `calc(${MAP_HEIGHT}px * ${varDefault.scale(1)})`,
        overflow: 'hidden',
      },
      '.map': {
        background: varDefault.mapOcean('#79b'),
        flex: '1 1 auto',
        overflow: 'hidden',
        outline: 'none',
      },
      '.map:focus-visible': {
        boxShadow: `inset 0 0 0 3px ${varDefault.focusColor('#fffc')}`,
      },
      '.map, svg': {
        width: '100%',
        height: '100%',
      },
      polygon: {
        transition: varDefault.transition('ease-out 0.3s'),
        fill: varDefault.mapLand('#555'),
        stroke: varDefault.mapLand('#555'),
        strokeWidth: 0.5,
      },
      'polygon.hover': {
        fill: varDefault.hoverColor('#888'),
        stroke: varDefault.hoverColor('#888'),
      },
      'polygon.hover-target': {
        fill: varDefault.hoverTargetColor('#444'),
        stroke: varDefault.hoverTargetColor('#444'),
      },
      'polygon.active': {
        fill: varDefault.activeZoneColor('#777'),
        stroke: varDefault.activeZoneColor('#777'),
      },
      'polygon.active-target': {
        fill: varDefault.activeColor('#333'),
        stroke: varDefault.activeColor('#333'),
      },
      '.tooltip': {
        position: 'absolute',
        pointerEvents: 'none',
        background: varDefault.tooltipBg('#000c'),
        color: varDefault.tooltipColor('white'),
        fontFamily: varDefault.fontFamily('sans-serif'),
        fontSize: varDefault.tooltipFontSize('11px'),
        padding: '1px 8px',
        borderRadius: '3px',
        whiteSpace: 'nowrap',
        display: 'none',
        zIndex: '1',
      },
      '.tooltip.visible': {
        display: 'block',
      },
      '.sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: '0',
      },
      '.zone-name': {
        fontFamily: varDefault.fontFamily('sans-serif'),
        position: 'absolute',
        bottom: varDefault.inset('10px'),
        left: varDefault.inset('10px'),
        right: varDefault.inset('10px'),
        color: varDefault.fontColor('white'),
        fontSize: varDefault.fontSize('16px'),
        padding: varDefault.padding('10px'),
        background: varDefault.inputBg('#fff4'),
        borderRadius: varDefault.inputRadius('5px'),
        textAlign: 'center',
        border: 'none',
        outline: 'none',
        /* firefox bug */
        width: `calc(100% - ${varDefault.inset('10px')} * 4)`,
      },
    }

    /** the region the keyboard cursor is on — distinct from the zone, which many share */
    private navRegion: Region | undefined
    /** the last name `value` and `timezone` agreed on — see validate() */
    private synced = localTimezone.name
    /** this instance's polygons, cached: hover walks them on every mousemove */
    private polygons: Element[] = []

    get zone(): Timezone {
      return zoneFromName(this.timezone) as Timezone
    }

    get region(): Region | undefined {
      return (
        regions.find((rg) => rg.timezone === this.timezone) ??
        regions.find((rg) => timezoneAliases[rg.timezone] === this.timezone)
      )
    }

    get zoneId(): string {
      return zoneId(this.zone)
    }

    hoverRegion = (event: Event): void => {
      const region = regionOfPolygon.get(event.target as Element)
      this.paintRegions(region, 'hover')
      if (region !== undefined) {
        this.showTooltip(region, event.target as Element)
      } else {
        this.hideTooltip()
      }
    }

    leaveMap = (): void => {
      this.paintRegions(undefined, 'hover')
      this.hideTooltip()
    }

    pickRegion = (event: Event): void => {
      const region = regionOfPolygon.get(event.target as Element)
      if (region !== undefined) {
        this.selectRegion(region, false)
      }
    }

    pickZone = (event: Event): void => {
      const { zoneName } = this.parts
      const zone = zoneFromId((event.target as HTMLInputElement).value)
      if (zone !== undefined) {
        this.navRegion = undefined
        this.value = this.timezone = zone.name
      } else {
        zoneName.value = this.zoneId
      }
    }

    focusInput = (event: Event): void => {
      ;(event.target as HTMLInputElement).select()
    }

    handleKeydown = (event: KeyboardEvent): void => {
      const { key } = event
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return
      event.preventDefault()

      const currentRegion = this.navRegion ?? this.region
      const currentOffset = currentRegion?.offset ?? this.zone?.offset ?? 0
      const currentY = currentRegion ? regionCenterY(currentRegion) : MAP_HEIGHT / 2

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        // step one offset band west or east, landing at a similar latitude
        const step = key === 'ArrowLeft' ? -1 : 1
        const index = offsets.indexOf(currentOffset)
        const offset = offsets[(index + step + offsets.length) % offsets.length]
        this.selectRegion(nearestByLatitude(regionsByOffset.get(offset)!, currentY))
      } else {
        // walk the zones within this band, north to south
        const bandRegions = regionsByOffset.get(currentOffset)
        if (bandRegions === undefined) return
        const step = key === 'ArrowUp' ? -1 : 1
        const index = currentRegion
          ? bandRegions.findIndex((r) => r.timezone === currentRegion.timezone)
          : -1
        const from = index === -1 ? 0 : index
        this.selectRegion(bandRegions[(from + step + bandRegions.length) % bandRegions.length])
      }
    }

    content = fragment(
      div({
        class: 'map',
        part: 'map',
        tabindex: '0',
        role: 'application',
        ariaLabel: 'timezone map',
        ariaRoledescription: 'timezone picker',
        ariaDescribedby: TOOLTIP_ID,
      }),
      span({
        class: 'tooltip',
        part: 'tooltip',
        id: TOOLTIP_ID,
        role: 'tooltip',
      }),
      span({
        class: 'sr-only',
        part: 'liveRegion',
        ariaLive: 'polite',
        ariaAtomic: 'true',
      }),
      input({
        ariaLabel: 'timezone name, including GMT offset',
        placeholder: 'region/city GMT+x',
        class: 'zone-name',
        part: 'zoneName',
      }),
      datalist({ id: DATALIST_ID }, timezoneOptions())
    )

    private showTooltip(region: Region, polygon: Element): void {
      const { tooltip } = this.parts
      const polyRect = polygon.getBoundingClientRect()
      const hostRect = this.getBoundingClientRect()
      tooltip.textContent = regionId(region)
      tooltip.classList.add('visible')
      const tipRect = tooltip.getBoundingClientRect()
      const x = (polyRect.left + polyRect.right) / 2 - hostRect.left - tipRect.width / 2
      const y = polyRect.bottom - hostRect.top + 4
      tooltip.style.left = `${Math.max(0, Math.min(x, hostRect.width - tipRect.width))}px`
      tooltip.style.top = `${Math.max(0, Math.min(y, hostRect.height - tipRect.height))}px`
    }

    private hideTooltip(): void {
      this.parts.tooltip.classList.remove('visible')
    }

    private polygonForRegion(region: Region): Element | undefined {
      return this.polygons.find((p) => regionOfPolygon.get(p) === region)
    }

    /**
     * One pass over the polygons for a hover or selection change: `<class>` marks the
     * whole offset band, `<class>-target` the single region. Two classes, one walk —
     * hover fires on every mousemove across ~450 polygons.
     */
    private paintRegions(region: Region | undefined, className: string): void {
      const offset = region?.offset
      for (const polygon of this.polygons) {
        const rg = regionOfPolygon.get(polygon)
        polygon.classList.toggle(className, rg === region || rg?.offset === offset)
        polygon.classList.toggle(`${className}-target`, rg === region)
      }
    }

    private announce(region: Region): void {
      this.parts.liveRegion.textContent = regionId(region)
    }

    private selectRegion(region: Region, announce = true): void {
      const zone = zoneFromRegion(region)
      if (zone === undefined) return
      this.navRegion = region
      this.value = this.timezone = zone.name
      if (announce) {
        this.announce(region)
      }
      const polygon = this.polygonForRegion(region)
      if (polygon !== undefined) {
        this.showTooltip(region, polygon)
      }
    }

    /**
     * `value` and `timezone` are two names for one selection, but they are separate
     * properties (`value` is tosijs's change-firing property; `timezone` is the
     * attribute), so either can move independently. Whichever one changed since they
     * last agreed wins; an unknown name never does.
     */
    private validate(): void {
      const { value, timezone } = this
      if (value !== timezone) {
        if (value !== this.synced && zoneFromName(value) !== undefined) {
          this.timezone = value
        } else {
          this.value = timezone
        }
      }
      this.synced = this.timezone
    }

    connectedCallback(): void {
      // Reconcile before super — the element hasn't hydrated yet, so this can't fire a
      // spurious `change`. `value` is a plain field initialised to the local zone, so
      // without this a `timezone` attribute would paint the map but leave `value` behind.
      const attributeZone = this.getAttribute('timezone')
      if (attributeZone !== null && zoneFromName(attributeZone) !== undefined) {
        this.value = attributeZone
      } else if (zoneFromName(this.value) !== undefined) {
        this.timezone = this.value
      }
      this.synced = this.timezone

      super.connectedCallback()

      const { map, zoneName } = this.parts
      // `list` is a readonly property on HTMLInputElement, so it has to be an attribute
      zoneName.setAttribute('list', DATALIST_ID)
      if (map.querySelector('svg') === null) {
        map.append(timezoneMap())
        this.polygons = [...map.querySelectorAll('polygon')]
      }
      map.addEventListener('mouseover', this.hoverRegion)
      map.addEventListener('mouseleave', this.leaveMap)
      map.addEventListener('click', this.pickRegion)
      map.addEventListener('keydown', this.handleKeydown as EventListener)
      zoneName.addEventListener('change', this.pickZone)
      zoneName.addEventListener('focus', this.focusInput)

      // super.connectedCallback() already rendered, but the map didn't exist yet, so
      // that pass painted nothing. Without this the initial selection is invisible
      // until something else triggers a render.
      this.render()
    }

    render(): void {
      super.render()
      this.validate()
      this.paintRegions(this.region, 'active')
      this.parts.zoneName.value = this.zoneId
    }
  }

  return TimezonePicker as unknown as TimezonePickerConstructor
}

const blueprint = (
  _tag: string,
  module: XinFactory
): XinComponentSpec<TimezonePickerParts> => ({
  type: makeTimezonePickerClass(module) as unknown as Component<TimezonePickerParts>,
})

// structural check that we still satisfy tosijs's blueprint contract
const _isBlueprint: XinBlueprint<TimezonePickerParts> = blueprint

export default blueprint
