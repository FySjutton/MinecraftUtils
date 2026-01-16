'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three-stdlib'

export type Pattern = { color: string; pattern: string }

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

    /** Load OBJs */
    useEffect(() => {
        const loader = new OBJLoader()

        loader.load('/banner/banner_stand.obj', (obj) => {
            obj.position.set(0, -2, -5)
            setStand(obj)
        })

        loader.load('/banner/banner_main.obj', (obj) => {
            obj.position.set(0.09, 1.9, -5)
            obj.rotation.x = Math.PI
            const group = new THREE.Group()
            group.add(obj)
            setMain(group)
        })
    }, [])

    /** Apply stand texture */
    useEffect(() => {
        if (!stand) return
        const tex = new THREE.TextureLoader().load('/banner/banner_base.png')
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.NearestFilter
        tex.magFilter = THREE.NearestFilter

        stand.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const mat = child.material as THREE.MeshStandardMaterial
                mat.map = tex
                mat.needsUpdate = true
            }
        })
    }, [stand])

    /** Build banner texture (base + patterns) */
    useEffect(() => {
        if (!main) return

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const loadImage = (src: string) =>
            new Promise<HTMLImageElement>((res, rej) => {
                const img = new Image()
                img.onload = () => res(img)
                img.onerror = rej
                img.src = src
            })

        ;(async () => {
            const baseImg = await loadImage('/banner/patterns/textures/base.png')
            canvas.width = baseImg.width
            canvas.height = baseImg.height

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(baseImg, 0, 0)

            // base color
            ctx.fillStyle = baseColor
            ctx.globalCompositeOperation = 'multiply'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.globalCompositeOperation = 'destination-in'
            ctx.drawImage(baseImg, 0, 0)
            ctx.globalCompositeOperation = 'source-over'

            // patterns in order
            for (const p of patterns) {
                const img = await loadImage(
                    `/banner/patterns/textures/${p.pattern}.png`,
                )

                // TODO: Fixa rotationen, eller inverterade texturer

                const tmp = document.createElement('canvas')
                tmp.width = img.width
                tmp.height = img.height
                const tctx = tmp.getContext('2d')!

                tctx.drawImage(img, 0, 0)
                tctx.fillStyle = p.color
                tctx.globalCompositeOperation = 'multiply'
                tctx.fillRect(0, 0, tmp.width, tmp.height)
                tctx.globalCompositeOperation = 'destination-in'
                tctx.drawImage(img, 0, 0)
                tctx.globalCompositeOperation = 'source-over'

                ctx.drawImage(tmp, 0, 0)
            }

            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.minFilter = THREE.NearestFilter
            texture.magFilter = THREE.NearestFilter
            texture.needsUpdate = true

            main.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const mat = child.material as THREE.MeshStandardMaterial
                    mat.map = texture
                    mat.needsUpdate = true
                }
            })
        })()
    }, [baseColor, patterns, main])

    /** Sway animation */
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
                <hemisphereLight
                    groundColor={0x444444}
                    intensity={0.4}
                />
                <BannerScene baseColor={baseColor} patterns={patterns} />
            </Canvas>
        </div>
    )
}
