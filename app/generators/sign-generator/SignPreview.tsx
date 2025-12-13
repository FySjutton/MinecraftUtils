'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MinecraftText } from '@/lib/MinecraftText'
import { useEffect, useRef, useState } from 'react'
import { drawMinecraftSignToCanvas, DEFAULT_FONT_SIZE } from '@/app/generators/sign-generator/canvasRenderer'
import assert from 'node:assert'

interface MinecraftSignProps {
    lines: MinecraftText[][]
    fontSize?: number
}

const OBFUSCATED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const PIXEL_TO_WORLD = 0.0035

function randomObfuscatedChar() {
    return OBFUSCATED_CHARS[Math.floor(Math.random() * OBFUSCATED_CHARS.length)]
}

export function MinecraftSign({ lines, fontSize = DEFAULT_FONT_SIZE }: MinecraftSignProps) {
    const gltf = useGLTF('/minecraft_sign.gltf')
    const model = gltf.scene

    // center the model
    const bbox = new THREE.Box3().setFromObject(model)
    const center = new THREE.Vector3()
    bbox.getCenter(center)
    model.position.sub(center)

    const signMesh = model.getObjectByName('sign')
    assert(signMesh, 'Sign mesh not found')

    const signSize = new THREE.Vector3()
    new THREE.Box3().setFromObject(signMesh).getSize(signSize)

    const signCenter = new THREE.Vector3()
    new THREE.Box3().setFromObject(signMesh).getCenter(signCenter)

    const [textureState, setTextureState] = useState<{ texture: THREE.CanvasTexture; width: number; height: number } | null>(null)
    const textureRef = useRef<THREE.CanvasTexture | null>(null)

    // generate initial texture
    useEffect(() => {
        const canvas = drawMinecraftSignToCanvas(lines, fontSize)
        const tex = new THREE.CanvasTexture(canvas)
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.flipY = true
        tex.needsUpdate = true
        textureRef.current = tex

        // defer setState to avoid ESLint cascading render warning
        const id = requestAnimationFrame(() => {
            setTextureState({ texture: tex, width: canvas.width, height: canvas.height })
        })

        return () => {
            cancelAnimationFrame(id)
            tex.dispose()
        }
    }, [lines, fontSize])

    // update obfuscated characters
    useFrame(() => {
        if (!textureRef.current) return

        let needsUpdate = false
        const updatedLines = lines.map(line =>
            line.map(ch => {
                if (ch.obfuscated) {
                    needsUpdate = true
                    return { ...ch, char: randomObfuscatedChar() }
                }
                return ch
            })
        )
        if (needsUpdate) {
            const canvas = drawMinecraftSignToCanvas(updatedLines, fontSize)
            textureRef.current.image = canvas
            textureRef.current.needsUpdate = true
            setTextureState({ texture: textureRef.current, width: canvas.width, height: canvas.height })
        }
    })

    if (!textureState) return <primitive object={model} />

    const planeWidth = textureState.width * PIXEL_TO_WORLD
    const planeHeight = textureState.height * PIXEL_TO_WORLD

    const TOP_INSET_WORLD = signSize.y * 0.06
    const signTopY = signCenter.y - signSize.y / 2 - 0.08
    const planeCenterY = signTopY - TOP_INSET_WORLD - planeHeight / 2
    const planeZ = signCenter.z + 0.065

    return (
        <group>
            <primitive object={model} />
            <mesh position={[signCenter.x, planeCenterY, planeZ]}>
                <planeGeometry args={[planeWidth, planeHeight]} />
                <meshBasicMaterial map={textureState.texture} transparent />
            </mesh>
        </group>
    )
}

export default function SignPreview({ lines }: { lines: MinecraftText[][] }) {
    return (
        <div className="w-[300px] h-[300px] border rounded-md">
            <Canvas camera={{ position: [0, 0.4, 3], fov: 50 }}>
                <ambientLight intensity={1.5} />
                <MinecraftSign lines={lines} />
                <OrbitControls
                    target={[0, 0.3, 0]}
                    enablePan={false}
                    enableZoom
                    minDistance={1}
                    maxDistance={5}
                    zoomSpeed={0.8}
                />
            </Canvas>
        </div>
    )
}
