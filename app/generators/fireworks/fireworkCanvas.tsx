'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {FireworkScene} from "@/app/generators/fireworks/scene";
import {FireworkExplosion} from "@/app/generators/fireworks/algorithms";

export interface FireworkCanvasRef {
    launchFirework: (explosion: FireworkExplosion) => void;
    setRandomRotation: (enabled: boolean) => void;
    getParticleCount: () => number;
}

interface FireworkCanvasProps {
    onParticleCountChange?: (count: number) => void;
}

export const FireworkCanvas = forwardRef<FireworkCanvasRef, FireworkCanvasProps>(
    ({ onParticleCountChange }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const sceneRef = useRef<FireworkScene | null>(null);

        useImperativeHandle(ref, () => ({
            launchFirework: (explosion: FireworkExplosion) => {
                sceneRef.current?.launchFirework(explosion);
            },
            setRandomRotation: (enabled: boolean) => {
                sceneRef.current?.setRandomRotation(enabled);
            },
            getParticleCount: () => {
                return sceneRef.current?.getParticleCount() || 0;
            },
        }));

        useEffect(() => {
            if (!canvasRef.current) return;

            const scene = new FireworkScene(canvasRef.current);
            sceneRef.current = scene;
            scene.start();

            // Particle count update loop
            let particleCountInterval: NodeJS.Timeout | null = null;
            if (onParticleCountChange) {
                particleCountInterval = setInterval(() => {
                    onParticleCountChange(scene.getParticleCount());
                }, 100);
            }

            const handleResize = () => {
                if (canvasRef.current && sceneRef.current) {
                    sceneRef.current.handleResize(
                        canvasRef.current.clientWidth,
                        canvasRef.current.clientHeight
                    );
                }
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (particleCountInterval) {
                    clearInterval(particleCountInterval);
                }
                scene.dispose();
                sceneRef.current = null;
            };
        }, [onParticleCountChange]);

        return (
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        );
    }
);

FireworkCanvas.displayName = 'FireworkCanvas';

