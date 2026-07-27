import type { Component, ElementCreator, PartsMap, XinComponentSpec, XinFactory, XinStyleSheet } from 'tosijs';
import { Timezone } from './timezones';
import { Region } from './regions';
export interface TimezonePickerParts extends PartsMap {
    map: HTMLDivElement;
    tooltip: HTMLSpanElement;
    liveRegion: HTMLSpanElement;
    zoneName: HTMLInputElement;
}
/** The public instance API of `<tosijs-timezone-picker>`. */
export interface TimezonePickerElement extends Component<TimezonePickerParts> {
    /** the selected IANA timezone name — always valid */
    value: string;
    /** the selected IANA timezone name (attribute-backed); kept in sync with `value` */
    timezone: string;
    readonly zone: Timezone;
    readonly region: Region | undefined;
    readonly zoneId: string;
}
export interface TimezonePickerConstructor {
    new (): TimezonePickerElement;
    preferredTagName?: string;
    initAttributes?: Record<string, any>;
    shadowStyleSpec?: XinStyleSheet;
    elementCreator(): ElementCreator<TimezonePickerElement>;
}
/**
 * Builds the component class from an injected tosijs. Exported for the eager
 * `<tosijs-timezone-picker>` registration in `timezone-picker.ts`, which needs the class
 * synchronously; everyone else wants the `XinBlueprint` default export below.
 */
export declare const makeTimezonePickerClass: (module: XinFactory) => TimezonePickerConstructor;
declare const blueprint: (_tag: string, module: XinFactory) => XinComponentSpec<TimezonePickerParts>;
export default blueprint;
