import { Component } from 'tosijs';
import { Timezone } from './timezones';
import { Region } from './regions';
export declare class TimezonePicker extends Component {
    value: string;
    static preferredTagName: string;
    static initAttributes: {
        timezone: string;
    };
    static shadowStyleSpec: {
        ':host': {
            display: string;
            flexDirection: string;
            position: string;
            width: string;
            height: string;
            overflow: string;
        };
        '.map': {
            background: string;
            flex: string;
            overflow: string;
        };
        '.map, svg': {
            width: string;
            height: string;
        };
        polygon: {
            transition: string;
            fill: string;
            stroke: string;
            strokeWidth: number;
        };
        'polygon.hover': {
            fill: string;
            stroke: string;
        };
        'polygon.hover-target': {
            fill: string;
            stroke: string;
        };
        'polygon.active': {
            fill: string;
            stroke: string;
        };
        'polygon.active-target': {
            fill: string;
            stroke: string;
        };
        'polygon.offset': {
            filter: string;
        };
        '.tooltip': {
            position: string;
            pointerEvents: string;
            background: string;
            color: string;
            fontFamily: string;
            fontSize: string;
            padding: string;
            borderRadius: string;
            whiteSpace: string;
            display: string;
            zIndex: string;
        };
        '.tooltip.visible': {
            display: string;
        };
        '.zone-name': {
            fontFamily: string;
            position: string;
            bottom: string;
            left: string;
            right: string;
            color: string;
            fontSize: string;
            padding: string;
            background: string;
            borderRadius: string;
            textAlign: string;
            border: string;
            outline: string;
            width: string;
        };
    };
    get zone(): Timezone;
    get region(): Region | undefined;
    get zoneId(): string;
    content: any;
    hoverRegion: (event: Event) => void;
    pickRegion: (event: Event) => void;
    pickZone: (event: Event) => void;
    focusInput: (event: Event) => void;
    connectedCallback(): void;
    private validate;
    private updateRegions;
    render(): void;
}
export declare const timezonePicker: import("tosijs").ElementCreator<TimezonePicker>;
