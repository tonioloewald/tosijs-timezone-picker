export interface Timezone {
    name: string;
    shortName?: string;
    abbr: string;
    offset: number;
}
export declare const timezones: Timezone[];
export declare const localTimezone: Timezone;
export declare const timezoneAliases: Record<string, string>;
export declare const zoneFromName: (name: string) => Timezone | undefined;
export declare const zoneId: (tz: Timezone) => string;
export declare const zoneFromId: (id: string) => Timezone | undefined;
