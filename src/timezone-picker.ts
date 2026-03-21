import { Component, elements } from 'tosijs'
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

const { fragment, div, span, option, input, datalist } = elements

const SVG_XMLNS = 'http://www.w3.org/2000/svg'
const DATALIST_ID = '-timezone-list-'

const regionKey = Symbol('region')

// unique offsets sorted west to east
const offsets = [...new Set(regions.map((r) => r.offset))].sort((a, b) => a - b)

// centroid Y of a region's polygon (lower = more north in SVG coords)
const regionCenterY = (region: Region): number => {
  const ys = region.points.split(',').filter((_, i) => i % 2 === 1).map(Number)
  return ys.reduce((a, b) => a + b, 0) / ys.length
}

// one representative region per timezone per offset, sorted north to south
const regionsByOffset = new Map<number, Region[]>()
for (const offset of offsets) {
  const offsetRegions = regions.filter((r) => r.offset === offset)
  const seen = new Set<string>()
  const unique: Region[] = []
  for (const r of offsetRegions) {
    if (!seen.has(r.timezone)) {
      seen.add(r.timezone)
      unique.push(r)
    }
  }
  regionsByOffset.set(offset, unique.sort((a, b) => regionCenterY(a) - regionCenterY(b)))
}

const timezoneMap = (): any => {
  const svg = document.createElementNS(SVG_XMLNS, 'svg')
  svg.setAttribute('viewBox', '0 0 500 250')
  svg.setAttribute('alt', 'world timezone map')
  svg.append(
    ...regions.map((region) => {
      const polygon = document.createElementNS(SVG_XMLNS, 'polygon')
      polygon.setAttribute('points', region.points)
      polygon[regionKey] = region
      return polygon
    }),
  )
  return svg
}

const timezoneDatalist = datalist(
  { id: DATALIST_ID },
  ...timezones.map((tz) => option({ value: zoneId(tz) })),
)

export class TimezonePicker extends Component {
  value = localTimezone.name
  private _navRegion: Region | undefined

  static preferredTagName = 'tosijs-timezone-picker'

  static initAttributes = {
    timezone: localTimezone.name,
  }

  static shadowStyleSpec = {
    ':host': {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      width: `calc(500px * var(--scale, 1))`,
      height: `calc(250px * var(--scale, 1))`,
      overflow: 'hidden',
    },
    '.map': {
      background: 'var(--map-ocean, #79b)',
      flex: '1 1 auto',
      overflow: 'hidden',
      outline: 'none',
    },
    '.map:focus': {
      boxShadow: 'inset 0 0 0 3px var(--focus-color, #fffc)',
    },
    '.map, svg': {
      width: '100%',
      height: '100%',
    },
    polygon: {
      transition: 'var(--transition, ease-out 0.3s)',
      fill: 'var(--map-land, #555)',
      stroke: 'var(--map-land, #555)',
      strokeWidth: 0.5,
    },
    'polygon.hover': {
      fill: 'var(--hover-color, #888)',
      stroke: 'var(--hover-color, #888)',
    },
    'polygon.hover-target': {
      fill: 'var(--hover-target-color, #444)',
      stroke: 'var(--hover-target-color, #444)',
    },
    'polygon.active': {
      fill: `var(--active-zone-color, #777)`,
      stroke: `var(--active-zone-color, #777)`,
    },
    'polygon.active-target': {
      fill: `var(--active-color, #333)`,
      stroke: `var(--active-color, #333)`,
    },
    'polygon.offset': {
      filter: `var(--offset-filter, brightness(0.75))`,
    },
    '.tooltip': {
      position: 'absolute',
      pointerEvents: 'none',
      background: 'var(--tooltip-bg, #000c)',
      color: 'var(--tooltip-color, white)',
      fontFamily: 'var(--font-family, Sans-serif)',
      fontSize: 'var(--tooltip-font-size, 11px)',
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
      fontFamily: 'var(--font-family, Sans-serif)',
      position: 'absolute',
      bottom: `var(--inset, 10px)`,
      left: `var(--inset, 10px)`,
      right: `var(--inset, 10px)`,
      color: 'var(--font-color, white)',
      fontSize: 'var(--font-size, 16px)',
      padding: `calc(var(--padding, 10px))`,
      background: 'var(--input-bg, #fff4)',
      borderRadius: 'var(--input-radius, 5px)',
      textAlign: 'center',
      border: 'none',
      outline: 'none',
      /* firefox bug */
      width: 'calc(100% - var(--inset, 10px) * 4)',
    },
  }

  get zone(): Timezone {
    return zoneFromName(this.timezone) as Timezone
  }

  get region(): Region | undefined {
    return regions.find((rg) => rg.timezone === this.timezone)
      ?? regions.find((rg) => timezoneAliases[rg.timezone] === this.timezone)
  }

  get zoneId(): string {
    return zoneId(this.zone)
  }

  content = fragment(
    div({
      class: 'map',
      part: 'map',
      tabindex: '0',
      role: 'application',
      ariaLabel: 'timezone map',
      ariaRoledescription: 'timezone picker',
      ariaDescribedby: '-tz-tooltip-',
    }),
    span({
      class: 'tooltip',
      part: 'tooltip',
      id: '-tz-tooltip-',
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
    timezoneDatalist,
  )

  private showTooltip(region: Region, polygon: Element) {
    const { tooltip } = this.parts
    const polyRect = polygon.getBoundingClientRect()
    const hostRect = this.getBoundingClientRect()
    tooltip.textContent = regionId(region)
    tooltip.classList.add('visible')
    const tipRect = tooltip.getBoundingClientRect()
    let x = (polyRect.left + polyRect.right) / 2 - hostRect.left - tipRect.width / 2
    let y = polyRect.bottom - hostRect.top + 4
    x = Math.max(0, Math.min(x, hostRect.width - tipRect.width))
    y = Math.max(0, Math.min(y, hostRect.height - tipRect.height))
    // @ts-expect-error
    tooltip.style.left = `${x}px`
    // @ts-expect-error
    tooltip.style.top = `${y}px`
    // @ts-expect-error
    tooltip.style.transform = ''
  }

  private hideTooltip() {
    this.parts.tooltip.classList.remove('visible')
  }

  private polygonForRegion(region: Region): Element | undefined {
    const { map } = this.parts
    return [...map.querySelectorAll('polygon')].find((p) => p[regionKey] === region)
  }

  hoverRegion = (event: Event): void => {
    // @ts-expect-error
    const region = event.target[regionKey] as Region | undefined
    this.updateRegions(region, 'hover')
    const { map } = this.parts
    ;[...map.querySelectorAll('polygon')].forEach((polygon) => {
      polygon.classList.toggle('hover-target', polygon[regionKey] === region)
    })
    if (region) {
      this.showTooltip(region, event.target as Element)
    } else {
      this.hideTooltip()
    }
  }

  pickRegion = (event: Event): void => {
    const { zoneName } = this.parts
    // @ts-expect-error
    const region = event.target[regionKey]
    if (region === undefined) {
      return
    }
    const zone = zoneFromRegion(region)
    if (zone !== undefined) {
      this._navRegion = region
      zoneName.value = this.zoneId
      this.value = this.timezone = zone.name
    }
  }

  pickZone = (event: Event): void => {
    const { zoneName } = this.parts
    // @ts-expect-error
    const id = event.target.value
    const zone = zoneFromId(id)
    if (zone !== undefined) {
      this._navRegion = undefined
      this.value = this.timezone = zone.name
    } else {
      zoneName.value = this.zoneId
    }
  }

  focusInput = (event: Event): void => {
    // @ts-expect-error
    event.target.select()
  }

  handleKeydown = (event: KeyboardEvent): void => {
    const { key } = event
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return
    event.preventDefault()

    const currentRegion = this._navRegion ?? this.region
    const currentOffset = currentRegion?.offset ?? this.zone?.offset ?? 0
    const offsetIndex = offsets.indexOf(currentOffset)

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const dir = key === 'ArrowLeft' ? -1 : 1
      const newIndex = (offsetIndex + dir + offsets.length) % offsets.length
      const newOffset = offsets[newIndex]
      const zoneRegions = regionsByOffset.get(newOffset)!
      // pick the region closest in latitude to current
      const currentY = currentRegion ? regionCenterY(currentRegion) : 125
      const closest = zoneRegions.reduce((best, r) =>
        Math.abs(regionCenterY(r) - currentY) < Math.abs(regionCenterY(best) - currentY) ? r : best,
      )
      this.selectRegion(closest)
    } else {
      const zoneRegions = regionsByOffset.get(currentOffset)!
      let currentIndex = currentRegion
        ? zoneRegions.findIndex((r) => r.timezone === currentRegion.timezone)
        : -1
      if (currentIndex === -1) currentIndex = 0
      const dir = key === 'ArrowUp' ? -1 : 1
      const newIndex = (currentIndex + dir + zoneRegions.length) % zoneRegions.length
      this.selectRegion(zoneRegions[newIndex])
    }
  }

  private announce(region: Region) {
    const { liveRegion } = this.parts
    liveRegion.textContent = regionId(region)
  }

  private selectRegion(region: Region) {
    const zone = zoneFromRegion(region)
    if (zone !== undefined) {
      this._navRegion = region
      this.value = this.timezone = zone.name
      this.announce(region)
      const polygon = this.polygonForRegion(region)
      if (polygon) {
        this.showTooltip(region, polygon)
      }
    }
  }

  connectedCallback() {
    super.connectedCallback()

    const { map, zoneName } = this.parts
    zoneName.setAttribute('list', DATALIST_ID)
    if (map.querySelector('svg') === null) {
      map.append(timezoneMap())
    }
    map.addEventListener('mouseover', this.hoverRegion)
    map.addEventListener('click', this.pickRegion)
    map.addEventListener('keydown', this.handleKeydown)
    zoneName.addEventListener('change', this.pickZone)
    zoneName.addEventListener('focus', this.focusInput)
  }

  private validate() {
    if (this.value !== this.timezone) {
      const newZone = zoneFromName(this.value)
      if (newZone === undefined) {
        this.value = this.timezone
      }
    }
  }

  private updateRegions(region: Region | undefined, className: string) {
    const { map } = this.parts
    ;[...map.querySelectorAll(`polygon`)].forEach((polygon) => {
      const rg = polygon[regionKey] as Region
      polygon.classList.toggle(
        className,
        rg === region || rg.offset === region?.offset,
      )
    })
  }

  render() {
    super.render()
    this.validate()
    this.updateRegions(this.region, 'active')
    const { map, zoneName } = this.parts
    const activeRegion = this.region
    ;[...map.querySelectorAll('polygon')].forEach((polygon) => {
      polygon.classList.toggle('active-target', polygon[regionKey] === activeRegion)
    })
    zoneName.value = this.zoneId
  }
}

export const timezonePicker = TimezonePicker.elementCreator()
