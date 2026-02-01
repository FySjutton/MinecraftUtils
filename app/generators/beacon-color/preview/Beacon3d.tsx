'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import {
    RepeatWrapping,
    NearestFilter,
    Texture,
    Mesh,
    TextureLoader,
    Group,
    MeshBasicMaterial,
    Color, DoubleSide
} from 'three'

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
    const tallTopHeight = 15

    const segmentHeights = [
        halfSegmentHeight,
        ...segments.map((_, i) =>
            i === segments.length - 1 ? tallTopHeight : fullSegmentHeight
        ),
    ]

    const segmentYPositions = segmentHeights.reduce<number[]>((acc, h, i) => {
        if (i === 0) acc.push(h / 2)
        else acc.push(acc[i - 1] + (h + segmentHeights[i - 1]) / 2)
        return acc
    }, [])

    const allSegments: SegmentTuple[] = [[null, ''], ...segments]

    const meshes = allSegments.map(([,], i) => {
        const yPos = segmentYPositions[i]
        const map = beamTextures[i]
        if (map) {
            map.repeat.set(1, segmentHeights[i])
            map.offset.set(0, 0)
        }
        return (
            <mesh key={i} position={[0, yPos, 0]}>
                <boxGeometry args={[beamWidth, segmentHeights[i], beamDepth]} />
                <meshBasicMaterial map={map} color="#ffffff" toneMapped={false} />
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
                        <meshBasicMaterial map={textures[i]} color="#ffffff" transparent toneMapped={false} />
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
    const beaconGltf = useGLTF('/assets/tool/beacon/beacon.gltf')
    const diamondTexture = new TextureLoader().load('/assets/tool/beacon/diamond_block.png', (tex) => {
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping
        tex.magFilter = NearestFilter
        tex.minFilter = NearestFilter
        tex.needsUpdate = true
    })

    beaconGltf.scene.traverse((child) => {
        if ((child as Mesh).isMesh) {
            const mesh = child as Mesh
            const oldMat = mesh.material

            const convert = (m: any) => {
                const mat = new MeshBasicMaterial({
                    toneMapped: false,
                    side: DoubleSide,
                    transparent: m.transparent ?? false,
                    opacity: m.opacity ?? 1,
                    alphaTest: m.alphaTest ?? 0,
                    depthWrite: true,
                    depthTest: true,
                })

                if (m.map) mat.map = m.map
                else if (m.color) mat.color = (m.color as Color).clone()
                else mat.color = new Color(0xffffff)

                return mat
            }

            if (Array.isArray(oldMat)) mesh.material = oldMat.map(convert)
            else mesh.material = convert(oldMat)
        }
    })

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

                {/* Beam + glass */}
                <Beacon segments={segments} beamTextures={beamTextures} />
                <GlassBlocks segments={segments} />

                {/* Beacon GLTF */}
                <primitive object={beaconGltf.scene.clone()} position={[0, -0.7, 0]} rotation={[0, 1.4, 0]}/>

                {/* 3x3 diamond blocks */}
                <group position={[0, -1.2, 0]} rotation={[0, 1.4, 0]}>
                    {[-1, 0, 1].map((x) =>
                        [-1, 0, 1].map((z) => (
                            <mesh key={`diamond-${x}-${z}`} position={[x, 0, z]}>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshBasicMaterial map={diamondTexture} toneMapped={false} />
                            </mesh>
                        ))
                    )}
                </group>

                <OrbitControls
                    enableRotate
                    enableZoom
                    minDistance={0.1}
                    maxDistance={z}
                    enablePan
                    target={orbitTarget}
                />
            </Canvas>
        </div>
    )
}
