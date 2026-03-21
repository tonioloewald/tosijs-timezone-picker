import { Component, elements } from 'tosijs'
import {
  localTimezone,
  timezones,
  Timezone,
  zoneId,
  zoneFromName,
  zoneFromId,
} from './timezones'
import { regions, Region, regionId, zoneFromRegion } from './regions'

const { fragment, div, option, input, datalist } = elements

const SVG_XMLNS = 'http://www.w3.org/2000/svg'
const DATALIST_ID = '-timezone-list-'

const regionKey = Symbol('region')

const timezoneMap = (): any => {
  const svg = document.createElementNS(SVG_XMLNS, 'svg')
  svg.setAttribute('viewBox', '0 0 500 250')
  svg.setAttribute('alt', 'world timezone map')
  svg.append(
    ...regions.map((region) => {
      const polygon = document.createElementNS(SVG_XMLNS, 'polygon')
      // of course svg elements don't support the title attribute
      const title = document.createElementNS(SVG_XMLNS, 'title')
      title.textContent = regionId(region)
      polygon.append(title)
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
    'polygon.active': {
      fill: `var(--active-color, #ccc)`,
      stroke: `var(--active-color, #ccc)`,
    },
    'polygon.offset': {
      filter: `var(--offset-filter, brightness(0.75))`,
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
  }

  get zoneId(): string {
    return zoneId(this.zone)
  }

  content = fragment(
    div({ class: 'map', part: 'map' }),
    input({
      title: 'timezone name, including GMT offset',
      placeholder: 'region/city GMT+x',
      class: 'zone-name',
      part: 'zoneName',
    }),
    timezoneDatalist,
  )

  hoverRegion = (event: Event): void => {
    // @ts-expect-error
    const region = event.target[regionKey]
    this.updateRegions(region, 'hover')
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
      this.value = this.timezone = zone.name
    } else {
      zoneName.value = this.zoneId
    }
  }

  focusInput = (event: Event): void => {
    // @ts-expect-error
    event.target.select()
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

    const { zoneName } = this.parts
    zoneName.value = this.zoneId
  }
}

export const timezonePicker = TimezonePicker.elementCreator()
