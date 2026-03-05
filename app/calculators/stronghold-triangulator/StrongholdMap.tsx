"use client"

import {useRef, useEffect, useCallback} from "react"
import {Throw, TriangulationResult} from "./triangulate"

const STRONGHOLD_RINGS = [
    {inner: 1408, outer: 2688, count: 3},
    {inner: 4480, outer: 5760, count: 6},
    {inner: 7552, outer: 8832, count: 10},
    {inner: 10624, outer: 11904, count: 15},
    {inner: 13696, outer: 14976, count: 21},
    {inner: 16768, outer: 18048, count: 28},
    {inner: 19840, outer: 21120, count: 36},
    {inner: 22912, outer: 24192, count: 9},
]

export const TAB_COLORS = [
    "#6ba5e7",
    "#e7826b",
    "#6be78a",
    "#e7d06b",
    "#c76be7",
]

export interface StrongholdMapData {
    throws: Throw[]
    result: TriangulationResult | null
}

interface StrongholdMapProps {
    strongholds: StrongholdMapData[]
    activeIndex: number
}

function yawToVector(yaw: number): {dx: number; dz: number} {
    const rad = yaw * (Math.PI / 180)
    return {dx: -Math.sin(rad), dz: Math.cos(rad)}
}

export default function StrongholdMap({strongholds, activeIndex}: StrongholdMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const transformRef = useRef({offsetX: 0, offsetY: 0, scale: 0.1})
    const dragRef = useRef<{startX: number; startY: number; startOffsetX: number; startOffsetY: number} | null>(null)
    const mouseRef = useRef<{x: number; z: number} | null>(null)
    const rafRef = useRef<number>(0)

    const screenToWorld = useCallback((sx: number, sy: number, canvas: HTMLCanvasElement) => {
        const t = transformRef.current
        const cx = canvas.width / 2 + t.offsetX
        const cy = canvas.height / 2 + t.offsetY
        return {
            x: (sx - cx) / t.scale,
            z: (sy - cy) / t.scale,
        }
    }, [])

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const w = canvas.width
        const h = canvas.height
        const t = transformRef.current
        const cx = w / 2 + t.offsetX
        const cy = h / 2 + t.offsetY

        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = "#16161e"
        ctx.fillRect(0, 0, w, h)

        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(t.scale, t.scale)

        // Stronghold rings
        for (const ring of STRONGHOLD_RINGS) {
            ctx.beginPath()
            ctx.arc(0, 0, ring.outer, 0, Math.PI * 2, false)
            ctx.arc(0, 0, ring.inner, 0, Math.PI * 2, true)
            ctx.fillStyle = "rgba(120, 200, 120, 0.06)"
            ctx.fill()
        }

        // Axes
        const extent = 30000
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
        ctx.lineWidth = 1.5 / t.scale
        ctx.beginPath()
        ctx.moveTo(-extent, 0)
        ctx.lineTo(extent, 0)
        ctx.moveTo(0, -extent)
        ctx.lineTo(0, extent)
        ctx.stroke()

        // Grid lines (adaptive)
        if (t.scale > 0.005) {
            const gridStep = t.scale > 0.1 ? 100 : 1000
            ctx.strokeStyle = "rgba(255, 255, 255, 0.025)"
            ctx.lineWidth = 0.5 / t.scale
            ctx.beginPath()
            for (let i = gridStep; i <= extent; i += gridStep) {
                ctx.moveTo(i, -extent)
                ctx.lineTo(i, extent)
                ctx.moveTo(-i, -extent)
                ctx.lineTo(-i, extent)
                ctx.moveTo(-extent, i)
                ctx.lineTo(extent, i)
                ctx.moveTo(-extent, -i)
                ctx.lineTo(extent, -i)
            }
            ctx.stroke()
        }

        // Draw each stronghold
        const RAY_LEN = 25000
        for (let si = 0; si < strongholds.length; si++) {
            const sh = strongholds[si]
            const color = TAB_COLORS[si % TAB_COLORS.length]
            const active = si === activeIndex
            const baseAlpha = active ? 1.0 : 0.25

            for (const thr of sh.throws) {
                const v = yawToVector(thr.yaw)

                // Uncertainty cone
                const coneAngle = 3 * (Math.PI / 180)
                const cos = Math.cos(coneAngle), sin = Math.sin(coneAngle)
                ctx.fillStyle = color
                ctx.globalAlpha = active ? 0.05 : 0.015
                ctx.beginPath()
                ctx.moveTo(thr.x, thr.z)
                ctx.lineTo(thr.x + (v.dx * cos - v.dz * sin) * RAY_LEN, thr.z + (v.dz * cos + v.dx * sin) * RAY_LEN)
                ctx.lineTo(thr.x + (v.dx * cos + v.dz * sin) * RAY_LEN, thr.z + (v.dz * cos - v.dx * sin) * RAY_LEN)
                ctx.closePath()
                ctx.fill()

                // Ray line
                ctx.globalAlpha = active ? 0.45 : 0.12
                ctx.strokeStyle = color
                ctx.lineWidth = (active ? 2 : 1.2) / t.scale
                ctx.beginPath()
                ctx.moveTo(thr.x, thr.z)
                ctx.lineTo(thr.x + v.dx * RAY_LEN, thr.z + v.dz * RAY_LEN)
                ctx.stroke()

                // Throw dot
                ctx.globalAlpha = baseAlpha
                ctx.fillStyle = color
                const dotR = Math.max((active ? 5 : 3.5) / t.scale, 2)
                ctx.beginPath()
                ctx.arc(thr.x, thr.z, dotR, 0, Math.PI * 2)
                ctx.fill()

                // Dot outline
                ctx.strokeStyle = "rgba(0,0,0,0.4)"
                ctx.lineWidth = 1 / t.scale
                ctx.stroke()
            }

            // Intersection result
            if (sh.result) {
                const rx = sh.result.x, rz = sh.result.z

                // Error radius circle
                if (sh.result.errorRadius > 0 && sh.result.errorRadius < 5000) {
                    ctx.globalAlpha = active ? 0.25 : 0.08
                    ctx.strokeStyle = color
                    ctx.lineWidth = 1.5 / t.scale
                    ctx.setLineDash([8 / t.scale, 6 / t.scale])
                    ctx.beginPath()
                    ctx.arc(rx, rz, sh.result.errorRadius, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.setLineDash([])
                }

                // Crosshair
                ctx.globalAlpha = baseAlpha
                ctx.strokeStyle = color
                ctx.lineWidth = 2.5 / t.scale
                const ch = Math.max(14 / t.scale, 10)
                ctx.beginPath()
                ctx.moveTo(rx - ch, rz)
                ctx.lineTo(rx + ch, rz)
                ctx.moveTo(rx, rz - ch)
                ctx.lineTo(rx, rz + ch)
                ctx.stroke()

                // Center dot
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(rx, rz, Math.max(5 / t.scale, 3), 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = "rgba(0,0,0,0.5)"
                ctx.lineWidth = 1 / t.scale
                ctx.stroke()
            }
        }

        ctx.globalAlpha = 1.0
        ctx.restore()

        // HUD overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
        ctx.fillRect(6, h - 26, 200, 20)
        ctx.fillStyle = "#aaa"
        ctx.font = "11px monospace"
        const m = mouseRef.current
        if (m) {
            ctx.fillText(`X: ${Math.floor(m.x)}   Z: ${Math.floor(m.z)}`, 12, h - 11)
        } else {
            ctx.fillText("Hover to see coordinates", 12, h - 11)
        }
    }, [strongholds, activeIndex, screenToWorld])

    // Resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const sync = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
            draw()
        }
        sync()

        const ro = new ResizeObserver(sync)
        ro.observe(canvas)
        return () => ro.disconnect()
    }, [draw])

    // Redraw on data change
    useEffect(() => { draw() }, [draw])

    const schedDraw = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(draw)
    }, [draw])

    // Attach wheel listener imperatively with { passive: false } so we can
    // call preventDefault() and prevent the page from scrolling while zooming.
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()

            const rect = canvas.getBoundingClientRect()
            const sx = e.clientX - rect.left
            const sy = e.clientY - rect.top

            const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
            const t = transformRef.current
            const newScale = Math.max(0.001, Math.min(128, t.scale * factor))

            // Zoom toward cursor
            const cx = canvas.width / 2 + t.offsetX
            const cy = canvas.height / 2 + t.offsetY
            const worldX = (sx - cx) / t.scale
            const worldZ = (sy - cy) / t.scale

            t.scale = newScale
            t.offsetX = sx - canvas.width / 2 - worldX * newScale
            t.offsetY = sy - canvas.height / 2 - worldZ * newScale

            cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(draw)
        }

        canvas.addEventListener("wheel", handleWheel, {passive: false})
        return () => canvas.removeEventListener("wheel", handleWheel)
    }, [draw])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startOffsetX: transformRef.current.offsetX,
            startOffsetY: transformRef.current.offsetY,
        }
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        mouseRef.current = screenToWorld(sx, sy, canvas)

        if (dragRef.current) {
            transformRef.current.offsetX = dragRef.current.startOffsetX + (e.clientX - dragRef.current.startX)
            transformRef.current.offsetY = dragRef.current.startOffsetY + (e.clientY - dragRef.current.startY)
        }
        schedDraw()
    }, [screenToWorld, schedDraw])

    const handleMouseUp = useCallback(() => {
        dragRef.current = null
    }, [])

    const handleMouseLeave = useCallback(() => {
        dragRef.current = null
        mouseRef.current = null
        schedDraw()
    }, [schedDraw])

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-grab active:cursor-grabbing"
            style={{touchAction: "none"}}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    )
}