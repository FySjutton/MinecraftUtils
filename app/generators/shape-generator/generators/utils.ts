export function degToRad(deg: number) {
    return (deg * Math.PI) / 180;
}

export function pointInPolygon(px: number, py: number, poly: [number, number][]) {
    let inside = false;
    const EPS = 1e-9;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const intersectsY = (yi <= py && py < yj) || (yj <= py && py < yi);
        if (!intersectsY) continue;
        const xIntersect = xi + ((xj - xi) * (py - yi)) / (yj - yi);
        if (px < xIntersect - EPS) inside = !inside;
    }
    return inside;
}