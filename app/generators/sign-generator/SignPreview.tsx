'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {useEffect, useMemo, useRef, useState} from 'react'
import { drawMinecraftSignToCanvas } from '@/app/generators/sign-generator/canvasRenderer'
import assert from 'node:assert'
import { SignSide } from "@/app/generators/sign-generator/SignGenerator"
import {findImageAsset} from "@/lib/images/getImageAsset";

interface MinecraftSignProps {
    signMaterial: string
    signType: 'sign' | 'hanging'
    front: SignSide
    back: SignSide
}

const OBFUSCATED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const PIXEL_TO_WORLD = 0.0035

function randomObfuscatedChar() {
    return OBFUSCATED_CHARS[Math.floor(Math.random() * OBFUSCATED_CHARS.length)]
}

export function MinecraftSign({ signMaterial, signType, front, back }: MinecraftSignProps) {
    const gltfPath = signType === 'sign' ? '/sign.gltf' : '/hanging.gltf'
    const gltf = useGLTF("/assets/tool/sign/" + gltfPath)
    const model = gltf.scene.clone(true)

    const fontSize = useMemo(() => (sign(signType) ? 36 : 32), [signType])
    const lineHeightMulti = useMemo(() => (sign(signType) ? 1.25 : 1.14), [signType])

    const bbox = new THREE.Box3().setFromObject(model)
    const center = new THREE.Vector3()
    bbox.getCenter(center)
    model.position.sub(center)

    const signMesh = model.getObjectByName('sign') as THREE.Mesh
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

    // --- Draw canvases for front/back text ---
    useEffect(() => {
        if (!front || !back) return

        const frontWithFallback = front.lines.map(line =>
            line.map(ch => ({ ...ch, color: ch.color ?? front.color }))
        )
        const backWithFallback = back.lines.map(line =>
            line.map(ch => ({ ...ch, color: ch.color ?? back.color }))
        )

        const frontC = drawMinecraftSignToCanvas(frontWithFallback, fontSize, lineHeightMulti, front.glowing)
        const backC = drawMinecraftSignToCanvas(backWithFallback, fontSize, lineHeightMulti, back.glowing)

        if (canvasesRafRef.current != null) cancelAnimationFrame(canvasesRafRef.current)
        canvasesRafRef.current = requestAnimationFrame(() => {
            setFrontCanvas(frontC)
            setBackCanvas(backC)
            canvasesRafRef.current = null
        })

        return () => {
            if (canvasesRafRef.current != null) cancelAnimationFrame(canvasesRafRef.current)
        }
    }, [front, back, fontSize])

    // --- Create Three.js textures from canvases ---
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

    // --- Obfuscated characters animation ---
    useFrame(() => {
        if (frontTextureRef.current) {
            let hasObf = false
            outer_front: for (const line of front.lines) {
                for (const ch of line) {
                    if (ch.obfuscated) { hasObf = true; break outer_front }
                }
            }
            if (hasObf) {
                const updated = front.lines.map(line => line.map(ch => ch.obfuscated ? { ...ch, char: randomObfuscatedChar() } : ch))
                const canvas = drawMinecraftSignToCanvas(updated, fontSize, lineHeightMulti)
                frontTextureRef.current.image = canvas
                frontTextureRef.current.needsUpdate = true
            }
        }

        if (backTextureRef.current) {
            let hasObf = false
            outer_back: for (const line of back.lines) {
                for (const ch of line) {
                    if (ch.obfuscated) { hasObf = true; break outer_back }
                }
            }
            if (hasObf) {
                const updated = back.lines.map(line => line.map(ch => ch.obfuscated ? { ...ch, char: randomObfuscatedChar() } : ch))
                backTextureRef.current.image = drawMinecraftSignToCanvas(updated, fontSize, lineHeightMulti)
                backTextureRef.current.needsUpdate = true
            }
        }
    })

    useEffect(() => {
        if (!model) return;

        const texturePath = findImageAsset(`${signMaterial}_${signType === 'sign' ? 'sign' : 'hanging'}`);
        new THREE.TextureLoader().load(texturePath, (tex) => {
            tex.flipY = false;
            tex.minFilter = THREE.NearestFilter;
            tex.magFilter = THREE.NearestFilter;
            tex.generateMipmaps = false;
            tex.colorSpace = THREE.SRGBColorSpace;

            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const mat = mesh.material;
                    if (Array.isArray(mat)) {
                        mat.forEach((m) => {
                            if (m instanceof THREE.MeshStandardMaterial) {
                                m.map = tex;
                                m.needsUpdate = true;
                            }
                        });
                    } else if (mat instanceof THREE.MeshStandardMaterial) {
                        mat.map = tex;
                        mat.needsUpdate = true;
                    }
                }
            });
        });
    }, [model, signMaterial, signType]);

    if (!frontTexture || !backTexture || !frontCanvas || !backCanvas) return <primitive object={model} />

    const frontWidth = frontCanvas.width * PIXEL_TO_WORLD
    const frontHeight = frontCanvas.height * PIXEL_TO_WORLD
    const backWidth = backCanvas.width * PIXEL_TO_WORLD
    const backHeight = backCanvas.height * PIXEL_TO_WORLD

    const signTopY = signCenter.y + signSize.y / 2

    const planeFrontY = signTopY - signSize.y - 0.11 - frontHeight / 2 + (sign(signType) ? 0 : 0.18)
    const planeBackY = signTopY - signSize.y - 0.11 - backHeight / 2 + (sign(signType) ? 0 : 0.18)

    const planeFrontZ = signCenter.z + 0.065
    const planeBackZ = signCenter.z - 0.065

    return (
        <group key={`${signMaterial}-${signType}`}>
            <primitive object={model} />

            <mesh position={[signCenter.x, planeFrontY, planeFrontZ]}>
                <planeGeometry args={[frontWidth, frontHeight]} />
                <meshBasicMaterial map={frontTexture} transparent />
            </mesh>

            <mesh position={[signCenter.x, planeBackY, planeBackZ]} rotation-y={Math.PI}>
                <planeGeometry args={[backWidth, backHeight]} />
                <meshBasicMaterial map={backTexture} transparent />
            </mesh>
        </group>
    )
}

export default function SignPreview({front, back, signMaterial, signType,}: { front: SignSide, back: SignSide, signMaterial: string, signType: 'sign' | 'hanging' }) {
    return (
        <Canvas camera={{ position: [0, 2, 3], fov: 50 }}>
            <ambientLight intensity={1.5} />
            <MinecraftSign front={front} back={back} signMaterial={signMaterial} signType={signType} />
            <OrbitControls
                target={[0, sign(signType) ? 0.45 : -0.15, 0]}
                enablePan={false}
                enableZoom
                minDistance={1}
                maxDistance={5}
                zoomSpeed={0.8}
            />
        </Canvas>
    )
}

function sign(text: string) {
    return text == "sign"
}
