export function ellipseDistance(
    x: number,
    y: number,
    rx: number,
    ry: number
): number {
    return Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
}
