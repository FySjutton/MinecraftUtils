'use client'

import {Canvas, useFrame} from '@react-three/fiber'
import {OrbitControls, useGLTF} from '@react-three/drei'
import * as THREE from 'three'
import {MinecraftText} from '@/lib/MinecraftText'
import {useEffect, useRef, useState} from 'react'
import {DEFAULT_FONT_SIZE, drawMinecraftSignToCanvas} from '@/app/generators/sign-generator/canvasRenderer'
import assert from 'node:assert'

interface MinecraftSignProps {
    frontLines: MinecraftText[][]
    backLines: MinecraftText[][]
    fontSize?: number
}

const OBFUSCATED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const PIXEL_TO_WORLD = 0.0035

function randomObfuscatedChar() {
    return OBFUSCATED_CHARS[Math.floor(Math.random() * OBFUSCATED_CHARS.length)]
}

export function MinecraftSign({ frontLines, backLines, fontSize = DEFAULT_FONT_SIZE }: MinecraftSignProps) {
    const gltf = useGLTF('/minecraft_sign.gltf')
    const model = gltf.scene

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

    const [frontCanvas, setFrontCanvas] = useState<HTMLCanvasElement | null>(null)
    const [backCanvas, setBackCanvas] = useState<HTMLCanvasElement | null>(null)

    const [frontTexture, setFrontTexture] = useState<THREE.CanvasTexture | null>(null)
    const [backTexture, setBackTexture] = useState<THREE.CanvasTexture | null>(null)

    const frontTextureRef = useRef<THREE.CanvasTexture | null>(null)
    const backTextureRef = useRef<THREE.CanvasTexture | null>(null)

    const canvasesRafRef = useRef<number | null>(null)
    const texturesRafRef = useRef<number | null>(null)

    useEffect(() => {
        const frontC = drawMinecraftSignToCanvas(frontLines, fontSize)
        const backC = drawMinecraftSignToCanvas(backLines, fontSize)

        if (canvasesRafRef.current != null) cancelAnimationFrame(canvasesRafRef.current)
        canvasesRafRef.current = requestAnimationFrame(() => {
            setFrontCanvas(frontC)
            setBackCanvas(backC)
            canvasesRafRef.current = null
        })

        return () => {
            if (canvasesRafRef.current != null) cancelAnimationFrame(canvasesRafRef.current)
        }
    }, [frontLines, backLines, fontSize])

    useEffect(() => {
        if (!frontCanvas || !backCanvas) return

        const frontTex = new THREE.CanvasTexture(frontCanvas)
        frontTex.minFilter = THREE.LinearFilter
        frontTex.magFilter = THREE.LinearFilter
        frontTex.flipY = true
        frontTextureRef.current = frontTex

        const backTex = new THREE.CanvasTexture(backCanvas)
        backTex.minFilter = THREE.LinearFilter
        backTex.magFilter = THREE.LinearFilter
        backTex.flipY = true
        backTextureRef.current = backTex

        if (texturesRafRef.current != null) cancelAnimationFrame(texturesRafRef.current)
        texturesRafRef.current = requestAnimationFrame(() => {
            setFrontTexture(frontTex)
            setBackTexture(backTex)
            texturesRafRef.current = null
        })

        return () => {
            if (texturesRafRef.current != null) cancelAnimationFrame(texturesRafRef.current)
            frontTextureRef.current?.dispose()
            backTextureRef.current?.dispose()
            frontTextureRef.current = null
            backTextureRef.current = null
        }
    }, [frontCanvas, backCanvas])

    useFrame(() => {
        if (frontTextureRef.current) {
            let hasObf = false
            outer_front: for (const line of frontLines) {
                for (const ch of line) {
                    if (ch.obfuscated) { hasObf = true; break outer_front }
                }
            }
            if (hasObf) {
                const updated = frontLines.map(line => line.map(ch => ch.obfuscated ? { ...ch, char: randomObfuscatedChar() } : ch))
                const canvas = drawMinecraftSignToCanvas(updated, fontSize)
                frontTextureRef.current.image = canvas
                frontTextureRef.current.needsUpdate = true
            }
        }

        if (backTextureRef.current) {
            let hasObf = false
            outer_back: for (const line of backLines) {
                for (const ch of line) {
                    if (ch.obfuscated) { hasObf = true; break outer_back }
                }
            }
            if (hasObf) {
                const updated = backLines.map(line => line.map(ch => ch.obfuscated ? { ...ch, char: randomObfuscatedChar() } : ch))
                backTextureRef.current.image = drawMinecraftSignToCanvas(updated, fontSize)
                backTextureRef.current.needsUpdate = true
            }
        }
    })

    if (!frontTexture || !backTexture || !frontCanvas || !backCanvas) return <primitive object={model} />

    const frontWidth = frontCanvas.width * PIXEL_TO_WORLD
    const frontHeight = frontCanvas.height * PIXEL_TO_WORLD
    const backWidth = backCanvas.width * PIXEL_TO_WORLD
    const backHeight = backCanvas.height * PIXEL_TO_WORLD

    const TOP_INSET_WORLD = signSize.y * 0.06
    const signTopY = signCenter.y - signSize.y / 2 - 0.08
    const planeCenterY = signTopY - TOP_INSET_WORLD - frontHeight / 2
    const planeFrontZ = signCenter.z + 0.065
    const planeBackZ = signCenter.z - 0.065

    return (
        <group>
            <primitive object={model} />

            <mesh position={[signCenter.x, planeCenterY, planeFrontZ]}>
                <planeGeometry args={[frontWidth, frontHeight]} />
                <meshBasicMaterial map={frontTexture} transparent />
            </mesh>

            <mesh position={[signCenter.x, planeCenterY, planeBackZ]} rotation-y={Math.PI}>
                <planeGeometry args={[backWidth, backHeight]} />
                <meshBasicMaterial map={backTexture} transparent />
            </mesh>
        </group>
    )
}

export default function SignPreview({ linesFront, linesBack }: { linesFront: MinecraftText[][], linesBack: MinecraftText[][] }) {
    return (
        <div className="w-[300px] h-[300px] border rounded-md">
            <Canvas camera={{ position: [0, 0.4, 3], fov: 50 }}>
                <ambientLight intensity={1.5} />
                <MinecraftSign frontLines={linesFront} backLines={linesBack} />
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
