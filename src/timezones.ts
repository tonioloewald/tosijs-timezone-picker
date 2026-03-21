const timeNow = new Date()

export interface Timezone {
  name: string
  shortName?: string
  abbr: string
  offset: number
}

// @ts-ignore-error
export const timezones: Timezone[] = Intl.supportedValuesOf('timeZone').map(name => {
  // @ts-expect-error
  const offset = Number(Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'shortOffset',
    timeZone: name
  }).format(timeNow).split('GMT').pop().replace(/\:30/, '.5'))

  const abbr = Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: name
  }).format(timeNow).split(' ').pop() as string

  const tz: Timezone = {
    name,
    abbr,
    offset,
  }

  const parts = name.split('/')
  if (parts.length === 3) {
    tz.shortName = `${parts[0]}/${parts[2]}`
  }

  return tz
})

export const localTimezone = timezones.find(z => z.name === Intl.DateTimeFormat().resolvedOptions().timeZone) as Timezone

// Map between deprecated and current IANA timezone names
export const timezoneAliases: Record<string, string> = {
  'Africa/Asmera': 'Africa/Asmara',
  'Africa/Asmara': 'Africa/Asmera',
  'America/Coral_Harbour': 'America/Edmonton',
  'America/Godthab': 'America/Nuuk',
  'America/Nuuk': 'America/Godthab',
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Kolkata': 'Asia/Calcutta',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Kathmandu': 'Asia/Katmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Yangon': 'Asia/Rangoon',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Ho_Chi_Minh': 'Asia/Saigon',
  'Europe/Kiev': 'Europe/Kyiv',
  'Europe/Kyiv': 'Europe/Kiev',
  'Europe/Uzhgorod': 'Europe/Kiev',
  'Europe/Zaporozhye': 'Europe/Kiev',
  'America/Montreal': 'America/Toronto',
  'America/Nipigon': 'America/Toronto',
  'America/Pangnirtung': 'America/Iqaluit',
  'America/Rainy_River': 'America/Winnipeg',
  'America/Santa_Isabel': 'America/Tijuana',
  'America/Thunder_Bay': 'America/Toronto',
  'America/Yellowknife': 'America/Edmonton',
  'Asia/Choibalsan': 'Asia/Ulaanbaatar',
  'Australia/Currie': 'Australia/Hobart',
  'Pacific/Johnston': 'Pacific/Honolulu',
}

export const zoneFromName = (name: string): Timezone | undefined => {
  return timezones.find(tz => tz.name === name || tz.shortName === name)
    ?? timezones.find(tz => tz.name === timezoneAliases[name])
}
export const zoneId = (tz: Timezone): string => {
  const name = (tz.shortName !== undefined ? tz.shortName : tz.name)
  const {offset} = tz
  const signedOffset = offset > 0 ? `+${offset}` : (offset < 0 ? String(offset) : '')
  return `${name.replace(/_/g, ' ')} GMT${signedOffset}`
}
export const zoneFromId = (id: string): Timezone | undefined => {
  return timezones.find(tz => id === zoneId(tz))
}