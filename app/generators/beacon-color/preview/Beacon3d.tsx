'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { RepeatWrapping, NearestFilter, Texture, Mesh, TextureLoader, Group } from 'three'

export type SegmentTuple = [string | null, string]

function createRecoloredTexture(color: string | null, img: HTMLImageElement): Texture {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    if (color) {
        const imgData = ctx.getImageData(0, 0, img.width, img.height)
        const data = imgData.data
        const r = parseInt(color.slice(1, 3), 16) / 255
        const g = parseInt(color.slice(3, 5), 16) / 255
        const b = parseInt(color.slice(5, 7), 16) / 255
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= r
            data[i + 1] *= g
            data[i + 2] *= b
        }
        ctx.putImageData(imgData, 0, 0)
    }
    const tex = new Texture(canvas)
    tex.wrapS = RepeatWrapping
    tex.wrapT = RepeatWrapping
    tex.magFilter = NearestFilter
    tex.minFilter = NearestFilter
    tex.needsUpdate = true
    return tex
}

interface BeaconProps {
    segments: SegmentTuple[]
    beamTextures: Texture[]
}

function Beacon({ segments, beamTextures }: BeaconProps) {
    const groupRef = useRef<Group>(null)
    const beamWidth = 0.3125
    const beamDepth = 0.3125
    const fullSegmentHeight = 2
    const halfSegmentHeight = fullSegmentHeight / 2
    const segmentHeights = [halfSegmentHeight, ...segments.map(() => fullSegmentHeight)]
    const segmentYPositions = segmentHeights.reduce<number[]>((acc, h, i) => {
        if (i === 0) acc.push(h / 2)
        else acc.push(acc[i - 1] + (h + segmentHeights[i - 1]) / 2)
        return acc
    }, [])
    const allSegments: SegmentTuple[] = [[null, ''], ...segments]

    const meshes = allSegments.map(([_, __], i) => {
        const yPos = segmentYPositions[i]
        const map = beamTextures[i]
        if (map) {
            map.repeat.set(1, segmentHeights[i])
            map.offset.set(0, 0)
        }
        return (
            <mesh key={i} position={[0, yPos, 0]}>
                <boxGeometry args={[beamWidth, segmentHeights[i], beamDepth]} />
                <meshBasicMaterial
                    map={map}
                    color="#ffffff"
                    toneMapped={false}
                />
            </mesh>
        )
    })

    useFrame((_, delta) => {
        if (!groupRef.current) return
        groupRef.current.rotation.y += delta
        groupRef.current.children.forEach((child) => {
            if (child instanceof Mesh) {
                const mat = child.material
                if ('map' in mat && mat.map instanceof Texture) {
                    mat.map.offset.y = (mat.map.offset.y + delta * 0.5) % 1
                }
            }
        })

    })

    return <group ref={groupRef}>{meshes}</group>
}

function GlassBlocks({ segments }: { segments: SegmentTuple[] }) {
    const fullSegmentHeight = 2
    const textures = segments.map(([_, glass]) => {
        const tex = new TextureLoader().load(`/assets/tool/beacon/glass/${glass}.png`)
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping
        tex.magFilter = NearestFilter
        tex.minFilter = NearestFilter
        tex.repeat.set(1, 1)
        tex.needsUpdate = true
        return tex
    })

    return (
        <>
            {segments.map(([], i) => {
                const yPos = 1 + i * fullSegmentHeight + fullSegmentHeight / 2 - 0.5
                return (
                    <mesh key={`glass-${i}`} position={[0, yPos, 0]} rotation={[0, 1.4, 0]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial
                            map={textures[i]}
                            color="#ffffff"
                            transparent
                            toneMapped={false}
                        />
                    </mesh>
                )
            })}
        </>
    )
}

interface Beacon3dProps {
    segments: SegmentTuple[]
    width?: number
    height?: number
}

export default function Beacon3d({ segments, width = 200, height = 1000 }: Beacon3dProps) {
    const [beamTextures, setBeamTextures] = useState<Texture[]>([])

    useEffect(() => {
        const img = new Image()
        img.src = '/assets/tool/beacon/beacon_beam.png'
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const textures = [[null, ''], ...segments].map(([color]) =>
                createRecoloredTexture(color, img)
            )
            setBeamTextures(textures)
        }
    }, [segments])

    const fullSegmentHeight = 2
    const halfSegmentHeight = fullSegmentHeight / 2
    const totalHeight = halfSegmentHeight + segments.length * fullSegmentHeight
    const beamWidth = 0.3125
    const beamDepth = 0.3125
    const glassSize = 1
    const fov = 35
    const fovRad = (fov * Math.PI) / 180
    const margin = 0.5
    const halfWidth = Math.max(beamWidth, glassSize) / 2
    const halfDepth = Math.max(beamDepth, glassSize) / 2
    const maxHalfXY = Math.sqrt(halfWidth ** 2 + halfDepth ** 2)
    const z = (totalHeight / 2 + margin) / Math.tan(fovRad / 2) + maxHalfXY * 2
    const cameraPosition: [number, number, number] = [0, totalHeight / 2, z]
    const orbitTarget: [number, number, number] = [0, totalHeight / 2, 0]

    if (!beamTextures.length) return <div style={{ width, height, background: '#000' }} />

    return (
        <div style={{ width: `${width}px`, height: `${height}px` }}>
            <Canvas camera={{ position: cameraPosition, fov }}>
                <ambientLight intensity={0.6} />
                <Beacon segments={segments} beamTextures={beamTextures} />
                <GlassBlocks segments={segments} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={false}
                    target={orbitTarget}
                />
            </Canvas>
        </div>
    )
}
