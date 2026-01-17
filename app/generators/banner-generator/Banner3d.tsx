'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three-stdlib'

import type { Pattern } from './BannerImageManager'
import { buildBannerCanvas } from './BannerImageManager'

interface Banner3DProps {
    baseColor: string
    patterns: Pattern[]
    width?: number
    height?: number
}

function BannerScene({baseColor, patterns}: { baseColor: string, patterns: Pattern[] }) {
    const mainRef = useRef<THREE.Group | null>(null)
    const [stand, setStand] = useState<THREE.Group | null>(null)
    const [main, setMain] = useState<THREE.Group | null>(null)

    useEffect(() => {
        const loader = new OBJLoader()

        loader.load('/assets/tool/banner/banner_stand.obj', (obj) => {
            obj.position.set(0, -2, -5)
            setStand(obj)
        })

        loader.load('/assets/tool/banner/banner_main.obj', (obj) => {
            obj.position.set(-0.1, -3.9, 0)

            const group = new THREE.Group()
            group.add(obj)
            group.position.set(0.09, 1.9, -5)

            setMain(group)
        })
    }, [])

    useEffect(() => {
        if (!stand) return

        const tex = new THREE.TextureLoader().load('/assets/tool/banner/banner_base.png')
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.NearestFilter
        tex.magFilter = THREE.NearestFilter

        stand.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return

            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material]

            materials.forEach((material) => {
                if (material instanceof THREE.Material && 'map' in material) {
                    ;(material as THREE.MeshStandardMaterial).map = tex
                    material.needsUpdate = true
                }
            })
        })
    }, [stand])

    useEffect(() => {
        if (!main) return

        let cancelled = false

        ;(async () => {
            const canvas = await buildBannerCanvas(baseColor, patterns)
            if (cancelled) return

            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.minFilter = THREE.NearestFilter
            texture.magFilter = THREE.NearestFilter
            texture.needsUpdate = true

            main.traverse((child) => {
                if (!(child instanceof THREE.Mesh)) return

                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material]

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

    useEffect(() => {
        let raf = 0

        const tick = () => {
            if (mainRef.current) {
                mainRef.current.rotation.z =
                    0.05 + Math.sin(Date.now() * 0.001) * 0.05
            }
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])

    return (
        <>
            {stand && <primitive object={stand} />}
            {main && <primitive ref={mainRef} object={main} />}
            <OrbitControls target={[0, 0, -5]} />
        </>
    )
}

export default function Banner3D({baseColor, patterns, width = 600, height = 400}: Banner3DProps) {
    return (
        <div style={{ width, height }}>
            <Canvas camera={{ position: [4, 1, -7], fov: 75 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 7]} intensity={0.6} />
                <hemisphereLight groundColor={0x444444} intensity={0.4} />
                <BannerScene baseColor={baseColor} patterns={patterns} />
            </Canvas>
        </div>
    )
}
