'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three-stdlib'

import type { Pattern } from '@/app/generators/banners/TextureManager'
import { buildTextureCanvas } from '@/app/generators/banners/TextureManager'
import {Toggle} from "@/components/ui/toggle";
import {Check, X} from "lucide-react";

interface Banner3DProps {
    baseColor: string
    patterns: Pattern[]
}

function BannerScene({baseColor, patterns, animate}: {
    baseColor: string
    patterns: Pattern[]
    animate: boolean
}) {
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
            const materials = Array.isArray(child.material) ? child.material : [child.material]
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
            const canvas = await buildTextureCanvas(baseColor, patterns, "banner")
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

    useEffect(() => {
        let raf = 0
        const tick = () => {
            if (mainRef.current) {
                if (animate) {
                    mainRef.current.rotation.z = 0.05 + Math.sin(Date.now() * 0.001) * 0.05
                } else {
                    mainRef.current.rotation.z = 0.07
                }
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [animate])

    return (
        <>
            {stand && <primitive object={stand} />}
            {main && <primitive ref={mainRef} object={main} />}
        </>
    )
}

export default function Banner3D({ baseColor, patterns }: Banner3DProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [animate, setAnimate] = useState(true)

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
                        camera={{ position: [4, 1, -6], fov: 60 }}
                    >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 10, 7]} intensity={0.6} />
                        <hemisphereLight groundColor={0x444444} intensity={0.4} />

                        <OrbitControls target={[0, 0, -5]} enableZoom={false} enablePan={false} />

                        <BannerScene baseColor={baseColor} patterns={patterns} animate={animate} />
                    </Canvas>
                )}
            </div>

            <div className="mt-2 flex w-full justify-end gap-2">
                <Toggle
                    aria-label="Front Glowing"
                    size="default"
                    variant="outline"
                    className="flex items-center gap-2"
                    pressed={animate}
                    onPressedChange={checked => setAnimate(checked)}
                >
                    {animate ? (<Check className="text-green-400" />) : (<X className="text-red-400" />)}
                    <span>{"Animated"}</span>
                </Toggle>
            </div>
        </div>
    )
}
