import * as THREE from 'three';
import { FireworkParticle } from './particle';

export type FireworkShape = 'SMALL_BALL' | 'LARGE_BALL' | 'STAR' | 'CREEPER' | 'BURST';

export interface FireworkExplosion {
    shape: FireworkShape;
    colors: string[];
    fadeColors: string[];
    hasTrail: boolean;
    hasTwinkle: boolean;
}

// Coordinates taken from minecraft source code, idk why so many decimals lol
const STAR_PARTICLE_COORDS = [
    [0.0, 1.0],
    [0.3455, 0.309],
    [0.9511, 0.309],
    [0.3795918367346939, -0.12653061224489795],
    [0.6122448979591837, -0.8040816326530612],
    [0.0, -0.35918367346938773],
];

const CREEPER_PARTICLE_COORDS = [
    [0.0, 0.2],
    [0.2, 0.2],
    [0.2, 0.6],
    [0.6, 0.6],
    [0.6, 0.2],
    [0.2, 0.2],
    [0.2, 0.0],
    [0.4, 0.0],
    [0.4, -0.6],
    [0.2, -0.6],
    [0.2, -0.4],
    [0.0, -0.4],
];

function nextGaussian(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function createExplosion(
    explosion: FireworkExplosion,
    origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    randomRotation: boolean = true
): FireworkParticle[] {
    const particles: FireworkParticle[] = [];

    const colors: number[] =
        explosion.colors.length > 0
            ? explosion.colors.map(c => Number.parseInt(c.replace('#', ''), 16))
            : [0x000000];

    const fadeColors: number[] =
        explosion.fadeColors.map(c =>
            Number.parseInt(c.replace('#', ''), 16)
        );

    const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
    const getRandomFadeColor = () =>
        fadeColors.length > 0 ? fadeColors[Math.floor(Math.random() * fadeColors.length)] : null;

    const createParticle = (vel: THREE.Vector3) => {
        particles.push(
            new FireworkParticle(
                origin,
                vel,
                getRandomColor(),
                getRandomFadeColor(),
                explosion.hasTrail,
                explosion.hasTwinkle
            )
        );
    };

    switch (explosion.shape) {
        case 'SMALL_BALL':
            createParticleBall(0.25, 2, createParticle);
            break;
        case 'LARGE_BALL':
            createParticleBall(0.5, 4, createParticle);
            break;
        case 'STAR':
            createParticleStar(0.5, createParticle, randomRotation);
            break;
        case 'CREEPER':
            createParticleCreeper(0.5, createParticle, randomRotation);
            break;
        case 'BURST':
            createParticleBurst(createParticle);
            break;
    }

    return particles;
}

function createParticleBall(
    size: number,
    radius: number,
    createParticle: (vel: THREE.Vector3) => void
): void {
    for (let j = -radius; j <= radius; j++) {
        for (let k = -radius; k <= radius; k++) {
            for (let l = -radius; l <= radius; l++) {
                const h = k + (Math.random() - Math.random()) * 0.5;
                const m = j + (Math.random() - Math.random()) * 0.5;
                const n = l + (Math.random() - Math.random()) * 0.5;
                const o = Math.sqrt(h * h + m * m + n * n) / size + nextGaussian() * 0.05;

                if (o > 0.001) {
                    createParticle(new THREE.Vector3(h / o, m / o, n / o));
                }

                if (j !== -radius && j !== radius && k !== -radius && k !== radius) {
                    l += radius * 2 - 1;
                }
            }
        }
    }
}

function createParticleStar(size: number, createParticle: (vel: THREE.Vector3) => void, randomRotation: boolean = true): void {
    const coords = STAR_PARTICLE_COORDS;

    const e = coords[0][0];
    const f = coords[0][1];
    createParticle(new THREE.Vector3(e * size, f * size, 0));

    const g = randomRotation ? Math.random() * Math.PI : 0;
    const h = 0.34;

    createShape(g, h, coords, size, e, f, createParticle);
}

function createShape(g: number, h: number, coords: number[][], size: number, e: number, f: number, createParticle: (vel: THREE.Vector3) => void) {
    for (let i = 0; i < 3; i++) {
        const j = g + i * Math.PI * h;
        let k = e;
        let l = f;

        for (let m = 1; m < coords.length; m++) {
            const n = coords[m][0];
            const o = coords[m][1];

            for (let p = 0.25; p <= 1.0; p += 0.25) {
                let q = k + (n - k) * p;
                const r = l + (o - l) * p;
                q *= size;
                const rScaled = r * size;
                const s = q * Math.sin(j);
                q *= Math.cos(j);

                for (let t = -1.0; t <= 1.0; t += 2.0) {
                    createParticle(new THREE.Vector3(q * t, rScaled, s * t));
                }
            }

            k = n;
            l = o;
        }
    }
}

function createParticleCreeper(size: number, createParticle: (vel: THREE.Vector3) => void, randomRotation: boolean = true): void {
    const coords = CREEPER_PARTICLE_COORDS;

    const e = coords[0][0];
    const f = coords[0][1];
    createParticle(new THREE.Vector3(e * size, f * size, 0));

    const g = randomRotation ? Math.random() * Math.PI : 0;
    const h = 0.034;

    createShape(g, h, coords, size, e, f, createParticle);
}

function createParticleBurst(createParticle: (vel: THREE.Vector3) => void): void {
    const d = nextGaussian() * 0.05;
    const e = nextGaussian() * 0.05;

    for (let i = 0; i < 70; i++) {
        const f = nextGaussian() * 0.15 + d;
        const g = nextGaussian() * 0.15 + e;
        const h = Math.random() * 0.5;
        createParticle(new THREE.Vector3(f, h, g));
    }
}