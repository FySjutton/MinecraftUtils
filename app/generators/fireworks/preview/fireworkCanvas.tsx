'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FireworkScene } from "@/app/generators/fireworks/preview/scene";
import { FireworkExplosion } from "@/app/generators/fireworks/base/algorithms";

export interface FireworkCanvasRef {
    launchFirework: (explosions: FireworkExplosion[]) => void;
    setRandomRotation: (enabled: boolean) => void;
    getParticleCount: () => number;
}

interface FireworkCanvasProps {
    onParticleCountChange?: (count: number) => void;
}

export const FireworkCanvas = forwardRef<FireworkCanvasRef, FireworkCanvasProps>(
    ({ onParticleCountChange }, ref) => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const sceneRef = useRef<FireworkScene | null>(null);

        useImperativeHandle(ref, () => ({
            launchFirework: (explosions: FireworkExplosion[]) => {
                for (const explosion of explosions) {
                    sceneRef.current?.launchFirework(explosion);
                }
            },
            setRandomRotation: (enabled: boolean) => {
                sceneRef.current?.setRandomRotation(enabled);
            },
            getParticleCount: () => sceneRef.current?.getParticleCount() || 0,
        }));

        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const scene = new FireworkScene(canvas);
            sceneRef.current = scene;
            scene.start();

            let particleCountInterval: NodeJS.Timeout | null = null;
            if (onParticleCountChange) {
                particleCountInterval = setInterval(() => {
                    onParticleCountChange(scene.getParticleCount());
                }, 100);
            }

            const resize = () => {
                if (!container) return;

                const maxWidth = container.clientWidth;
                const maxHeight = container.clientHeight;

                let width = maxWidth;
                let height = (width * 4) / 3;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = (height * 3) / 4;
                }

                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                scene.handleResize(width, height);
            };

            const resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(container);

            window.addEventListener('resize', resize);

            // Initial resize
            setTimeout(resize, 0);

            return () => {
                if (particleCountInterval) clearInterval(particleCountInterval);
                resizeObserver.disconnect();
                window.removeEventListener('resize', resize);
                scene.dispose();
                sceneRef.current = null;
            };
        }, [onParticleCountChange]);

        return (
            <div ref={containerRef} className="w-full h-full flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    className="block"
                />
            </div>
        );
    }
);

FireworkCanvas.displayName = 'FireworkCanvas';
