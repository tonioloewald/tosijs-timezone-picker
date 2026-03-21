export interface Point {
    x: number;
    y: number;
}
export type Polygon = Point[];
export declare function _area(a: Point, b: Point): number;
export declare function stringToPolygon(source: string): Polygon;
export declare function polygonToString(points: Polygon): string;
export declare function simplify(points: Polygon, threshold?: number): Polygon;
export declare function area(...points: Polygon): number;
