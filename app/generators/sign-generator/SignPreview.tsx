'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Text } from '@react-three/drei'
import * as THREE from 'three'

interface MinecraftSignProps {
    lines: string[]
}

function MinecraftSign({ lines }: MinecraftSignProps) {
    const gltf = useGLTF('/minecraft_sign.gltf')
    const model = gltf.scene

    // Center the model
    const bbox = new THREE.Box3().setFromObject(model)
    const center = new THREE.Vector3()
    bbox.getCenter(center)
    model.position.sub(center)

    // Get the sign mesh
    const signMesh = model.getObjectByName('sign')
    if (!signMesh) return <primitive object={model} />

    const signSize = new THREE.Vector3()
    new THREE.Box3().setFromObject(signMesh).getSize(signSize)
    const signCenter = new THREE.Vector3()
    new THREE.Box3().setFromObject(signMesh).getCenter(signCenter)

    const maxLines = 4
    const lineHeight = 0.126
    const padding = 0.03

    return (
        <group>
            <primitive object={model} />

            {lines.slice(0, maxLines).map((line, i) => (
                <Text
                    key={i}
                    position={[
                        signCenter.x,
                        signCenter.y + (signSize.y - 0.05) / 2 - lineHeight / 2 - i * (lineHeight + padding) - 0.03,
                        signCenter.z + 0.065,
                    ]}
                    font="/fonts/minecraft.woff"
                    fontSize={lineHeight}
                    anchorX="center"
                    anchorY="middle"
                    color="black"
                >
                    {line}
                </Text>
            ))}
        </group>
    )
}

export default function SignPreview({ lines }: { lines: string[] }) {
    return (
        <div className="w-[300px] h-[300px] border rounded-md">
            <Canvas camera={{ position: [0, 0.4, 3], fov: 50 }}>
                <ambientLight intensity={1.5} />
                <MinecraftSign lines={lines} />
                <OrbitControls
                    target={[0, 0.3, 0]}
                    enablePan={false}
                    enableZoom={true}
                    minDistance={1}
                    maxDistance={5}
                    zoomSpeed={0.8}
                />
            </Canvas>
        </div>
    )
}

