import { Timezone } from './timezones';
export interface Region {
    timezone: string;
    abbr: string;
    country: string;
    offset: number;
    points: string;
}
export declare const regionId: (region: Region) => string;
export declare const zoneFromRegion: (region: {
    timezone: string;
}) => Timezone;
export declare const regions: Region[];
