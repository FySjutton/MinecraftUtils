export interface Throw {
    x: number
    z: number
    yaw: number
}

export interface ThrowWarning {
    index: number
    message: string
}

export interface TriangulationResult {
    x: number
    z: number
    /** Average intersection angle between ray pairs (degrees) */
    angle: number
    /** Max distance between any two throw positions */
    throwSpacing: number
    /** Confidence label */
    confidence: "High" | "Moderate" | "Low" | "Very Low"
    /** Human-readable explanation of the confidence */
    confidenceReason: string
    /** Estimated error radius in blocks */
    errorRadius: number
    /** Warning about throw spacing */
    spacingWarning: string | null
    /** Per-throw warnings (questionable inputs) */
    throwWarnings: ThrowWarning[]
}

// F3 debug screen shows yaw to 0.1° — this is the assumed measurement precision.
// Using F3+C (clipboard) gives 0.01° but most players use the screen.
const SIGMA_RAD = 0.1 * (Math.PI / 180)

function yawToVector(yaw: number): { dx: number; dz: number } {
    // Minecraft yaw: 0 = south (+Z), 90 = west (-X), -90 = east (+X)
    const rad = yaw * (Math.PI / 180)
    return {
        dx: -Math.sin(rad),
        dz: Math.cos(rad),
    }
}

function distanceBetween(a: { x: number; z: number }, b: { x: number; z: number }): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.z - a.z) ** 2)
}

interface RayIntersection {
    x: number
    z: number
    angle: number
    /** Ray parameter for throw A — negative means intersection is behind throw direction */
    tA: number
    /** Ray parameter for throw B */
    tB: number
    iA: number
    iB: number
}

function intersectRays(a: Throw, b: Throw, iA: number, iB: number): RayIntersection | null {
    const va = yawToVector(a.yaw)
    const vb = yawToVector(b.yaw)

    const denom = va.dx * vb.dz - va.dz * vb.dx
    if (Math.abs(denom) < 1e-10) return null // parallel or anti-parallel

    const tA = ((b.x - a.x) * vb.dz - (b.z - a.z) * vb.dx) / denom
    const ix = a.x + tA * va.dx
    const iz = a.z + tA * va.dz

    // tB via dot product with unit direction vector
    const tB = (ix - b.x) * vb.dx + (iz - b.z) * vb.dz

    // Angle between direction vectors (0–180°)
    const dot = va.dx * vb.dx + va.dz * vb.dz
    const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI)

    return {x: ix, z: iz, angle, tA, tB, iA, iB}
}

/**
 * Estimate error radius (semi-major axis of error ellipse) from the
 * error propagation formula: a = r * σ_θ / (√2 · sin(γ/2))
 *
 * r = average distance from throws to intersection
 * γ = intersection angle between rays
 * σ_θ = angular measurement precision (0.1° from F3)
 */
function formulaErrorRadius(distToTarget: number, angleDeg: number): number {
    const halfGammaRad = (angleDeg / 2) * (Math.PI / 180)
    const sinHalf = Math.sin(halfGammaRad)
    if (sinHalf < 0.001) return 9999
    return distToTarget * SIGMA_RAD / (Math.SQRT2 * sinHalf)
}

/**
 * Confidence based on estimated error radius (in blocks).
 * Thresholds derived from surveying theory applied to Minecraft chunk size (16 blocks).
 */
function getConfidence(errorRadius: number): {confidence: TriangulationResult["confidence"]; label: string} {
    if (errorRadius <= 16) return {confidence: "High", label: "probably the right chunk"}
    if (errorRadius <= 50) return {confidence: "Moderate", label: "within a few chunks"}
    if (errorRadius <= 100) return {confidence: "Low", label: "broad area — consider adding throws"}
    return {confidence: "Very Low", label: "very unreliable — re-throw from further apart"}
}

function getSpacingWarning(distance: number): string | null {
    if (distance < 100) return "Throws are very close together — try walking 300+ blocks apart for better geometry."
    if (distance < 300) return "Throws are fairly close. Walking 500+ blocks apart would improve accuracy."
    return null
}

function getThrowWarnings(throws: Throw[], intersections: RayIntersection[], avgPoint: {x: number; z: number}): ThrowWarning[] {
    const warnings: ThrowWarning[] = []

    // Backward ray detection: throw direction points away from intersection
    const backwardCounts = new Map<number, number>()
    const totalPairs = new Map<number, number>()

    for (const inter of intersections) {
        for (const [idx, t] of [[inter.iA, inter.tA], [inter.iB, inter.tB]] as [number, number][]) {
            totalPairs.set(idx, (totalPairs.get(idx) ?? 0) + 1)
            if (t < 0) backwardCounts.set(idx, (backwardCounts.get(idx) ?? 0) + 1)
        }
    }

    for (const [idx, count] of backwardCounts) {
        const total = totalPairs.get(idx) ?? 1
        if (count > total / 2) {
            warnings.push({
                index: idx,
                message: "This throw's direction points away from the estimated stronghold. Double-check the yaw value.",
            })
        }
    }

    // Throw very close to estimated stronghold — eye barely moves, hard to measure
    for (let i = 0; i < throws.length; i++) {
        const dist = distanceBetween(throws[i], avgPoint)
        if (dist < 100) {
            warnings.push({
                index: i,
                message: `This throw is ~${Math.round(dist)} blocks from the estimate. Eye measurements near the stronghold are less precise.`,
            })
        }
    }

    // Throws too close to each other
    for (let i = 0; i < throws.length; i++) {
        for (let j = i + 1; j < throws.length; j++) {
            const dist = distanceBetween(throws[i], throws[j])
            if (dist < 50) {
                warnings.push({
                    index: j,
                    message: `Very close to throw ${i + 1} (${Math.round(dist)} blocks). Walk further apart.`,
                })
            }
        }
    }

    // Nearly parallel throws — tiny angle makes intersection wildly imprecise
    for (let i = 0; i < throws.length; i++) {
        for (let j = i + 1; j < throws.length; j++) {
            const va = yawToVector(throws[i].yaw)
            const vb = yawToVector(throws[j].yaw)
            const dot = va.dx * vb.dx + va.dz * vb.dz
            const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI)
            if (angle < 5) {
                warnings.push({
                    index: j,
                    message: `Nearly parallel to throw ${i + 1} (${angle.toFixed(1)}° apart). Walk perpendicular to the first throw's direction.`,
                })
            }
        }
    }

    // Deduplicate: keep first warning per throw index
    const seen = new Set<number>()
    return warnings.filter(w => {
        if (seen.has(w.index)) return false
        seen.add(w.index)
        return true
    })
}

export function triangulateMultiple(throws: Throw[]): TriangulationResult | null {
    if (throws.length < 2) return null

    // Compute all pairwise intersections
    const intersections: RayIntersection[] = []
    for (let i = 0; i < throws.length; i++) {
        for (let j = i + 1; j < throws.length; j++) {
            const result = intersectRays(throws[i], throws[j], i, j)
            if (result) intersections.push(result)
        }
    }

    if (intersections.length === 0) return null

    const avgX = intersections.reduce((s, p) => s + p.x, 0) / intersections.length
    const avgZ = intersections.reduce((s, p) => s + p.z, 0) / intersections.length
    const avgAngle = intersections.reduce((s, p) => s + p.angle, 0) / intersections.length
    const avgPoint = {x: avgX, z: avgZ}

    // Max throw spacing (baseline)
    let maxSpacing = 0
    for (let i = 0; i < throws.length; i++) {
        for (let j = i + 1; j < throws.length; j++) {
            maxSpacing = Math.max(maxSpacing, distanceBetween(throws[i], throws[j]))
        }
    }

    // Error radius estimation
    let errorRadius: number

    if (intersections.length >= 3) {
        // 3+ throws: use measured spread — how much pairwise intersections disagree
        errorRadius = Math.max(...intersections.map(p => distanceBetween(p, avgPoint)))
    } else {
        // 2 throws: use the error propagation formula (theoretical estimate)
        const avgDist = throws.reduce((s, t) => s + distanceBetween(t, avgPoint), 0) / throws.length
        errorRadius = formulaErrorRadius(avgDist, avgAngle)
    }

    errorRadius = Math.min(Math.round(errorRadius), 9999)

    const {confidence, label} = getConfidence(errorRadius)

    let confidenceReason: string
    if (intersections.length >= 3) {
        const pairWord = intersections.length === 3 ? "3 throw pairs" : `all ${intersections.length} throw pairs`
        if (confidence === "High") {
            confidenceReason = `${pairWord} converge within ~${errorRadius} blocks — ${label}.`
        } else {
            confidenceReason = `${pairWord} spread across ~${errorRadius} blocks — ${label}.`
        }
    } else {
        const angleStr = Math.round(avgAngle) + "°"
        if (errorRadius <= 50) {
            confidenceReason = `${angleStr} intersection angle, estimated error ~${errorRadius} blocks — ${label}. A 3rd throw would give a measured confidence.`
        } else {
            confidenceReason = `Narrow ${angleStr} intersection amplifies measurement error to ~${errorRadius} blocks — ${label}.`
        }
    }

    const throwWarnings = getThrowWarnings(throws, intersections, avgPoint)

    return {
        x: Math.round(avgX),
        z: Math.round(avgZ),
        angle: Math.round(avgAngle * 10) / 10,
        throwSpacing: Math.round(maxSpacing),
        confidence,
        confidenceReason,
        errorRadius,
        spacingWarning: getSpacingWarning(maxSpacing),
        throwWarnings,
    }
}
