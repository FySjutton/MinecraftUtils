'use client';

import { useState, useRef } from 'react';
import {FireworkCanvas, FireworkCanvasRef} from "@/app/generators/fireworks/fireworkCanvas";
import {FireworkControls} from "@/app/generators/fireworks/fireworkControls";
import {FireworkColors} from "@/lib/Colors";
import {FireworkExplosion} from "@/app/generators/fireworks/algorithms";

export default function FireworkPreview() {
    const canvasRef = useRef<FireworkCanvasRef>(null);
    const [particleCount, setParticleCount] = useState(0);
    const [randomRotation, setRandomRotation] = useState(false);
    const [explosion, setExplosion] = useState<FireworkExplosion>({
        shape: 'LARGE_BALL',
        colors: [FireworkColors.RED, FireworkColors.ORANGE],
        fadeColors: [FireworkColors.YELLOW],
        hasTrail: true,
        hasTwinkle: true,
    });

    const handleLaunch = () => {
        canvasRef.current?.launchFirework(explosion);
    };

    const handleRandomRotationChange = (enabled: boolean) => {
        setRandomRotation(enabled);
        canvasRef.current?.setRandomRotation(enabled);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Minecraft Firework Preview</h1>
                    <p className="text-muted-foreground mt-1">
                        Accurate particle simulation based on Minecraft source code
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Canvas */}
                    <div className="lg:col-span-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden border">
                            <FireworkCanvas ref={canvasRef} onParticleCountChange={setParticleCount} />
                        </div>
                    </div>

                    {/* Controls */}
                    <div>
                        <FireworkControls
                            explosion={explosion}
                            onExplosionChange={setExplosion}
                            onLaunch={handleLaunch}
                            particleCount={particleCount}
                            randomRotation={randomRotation}
                            onRandomRotationChange={handleRandomRotationChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}