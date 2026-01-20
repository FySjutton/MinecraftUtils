'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three-stdlib'

import { buildTextureCanvas } from '@/app/generators/banners/utils/TextureManager'
import {Pattern} from "@/app/generators/banners/utils/Utils";

interface Shield3DProps {
    baseColor: string
    patterns: Pattern[]
}

function ShieldScene({ baseColor, patterns }: { baseColor: string; patterns: Pattern[] }) {
    const mainRef = useRef<THREE.Group | null>(null)
    const [main, setMain] = useState<THREE.Group | null>(null)

    useEffect(() => {
        const loader = new OBJLoader()
        loader.load('/assets/tool/banner/shield.obj', (obj) => {
            const box = new THREE.Box3().setFromObject(obj)
            const size = box.getSize(new THREE.Vector3())
            const center = box.getCenter(new THREE.Vector3())

            obj.position.sub(center)
            const maxAxis = Math.max(size.x, size.y, size.z) || 1
            obj.scale.setScalar(2 / maxAxis)
            obj.position.set(0, -1, -5)

            const group = new THREE.Group()
            group.add(obj)
            setMain(group)
        })
    }, [])

    useEffect(() => {
        if (!main) return
        let cancelled = false

        ;(async () => {
            const canvas = await buildTextureCanvas(baseColor, patterns, "shield")
            if (cancelled) return

            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.minFilter = THREE.NearestFilter
            texture.magFilter = THREE.NearestFilter
            texture.needsUpdate = true

            main.traverse((child) => {
                if (!(child instanceof THREE.Mesh)) return
                const materials = Array.isArray(child.material) ? child.material : [child.material]
                materials.forEach((material) => {
                    if (material instanceof THREE.Material && 'map' in material) {
                        ;(material as THREE.MeshStandardMaterial).map = texture
                        material.needsUpdate = true
                    }
                })
            })
        })()

        return () => {
            cancelled = true
        }
    }, [baseColor, patterns, main])


    return <>{main && <primitive ref={mainRef} object={main} />}</>
}

export default function Shield3D({ baseColor, patterns }: Shield3DProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                setSize({ width, height })
            }
        })

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div className="flex flex-col items-center w-full h-full">
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                {size.width > 0 && size.height > 0 && (
                    <Canvas
                        style={{ width: size.width, height: size.height }}
                        camera={{ position: [2.82, 0.43, -5.2], fov: 45 }}
                    >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 10, 7]} intensity={0.6} />
                        <hemisphereLight groundColor={0x444444} intensity={0.4} />

                        <OrbitControls target={[0, 0, -5]} enableZoom enablePan={false} />

                        <ShieldScene baseColor={baseColor} patterns={patterns} />
                    </Canvas>
                )}
            </div>
        </div>
    )
}
