import * as THREE from 'three';

export class FireworkParticle {
    // From Particle class
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    alpha: number;
    age: number;
    lifetime: number;
    gravity: number;
    friction: number;
    rCol: number;
    gCol: number;
    bCol: number;

    // From SimpleAnimatedParticle
    parentFadeR: number;
    parentFadeG: number;
    parentFadeB: number;
    parentHasFade: boolean;

    // From SparkParticle
    fadeR: number;
    fadeG: number;
    fadeB: number;
    hasFade: boolean;

    // SparkParticle specific
    hasTrail: boolean;
    hasTwinkle: boolean;
    quadSize: number;

    constructor(
        pos: THREE.Vector3,
        vel: THREE.Vector3,
        color: number,
        fadeColor: number | null,
        hasTrail: boolean,
        hasTwinkle: boolean
    ) {
        this.position = pos.clone();
        this.velocity = vel.clone();
        this.quadSize = 0.2 * 0.75;
        this.lifetime = 48 + Math.floor(Math.random() * 12);
        this.friction = 0.91;
        this.gravity = 0.1;
        this.alpha = 1.0;
        this.age = 0;
        this.hasTrail = hasTrail;
        this.hasTwinkle = hasTwinkle;

        const tempColor = new THREE.Color(color);
        this.rCol = tempColor.r;
        this.gCol = tempColor.g;
        this.bCol = tempColor.b;

        if (fadeColor !== null) {
            const tempFade = new THREE.Color(fadeColor);
            this.parentFadeR = tempFade.r;
            this.parentFadeG = tempFade.g;
            this.parentFadeB = tempFade.b;
            this.parentHasFade = true;

            this.fadeR = tempFade.r;
            this.fadeG = tempFade.g;
            this.fadeB = tempFade.b;
            this.hasFade = true;
        } else {
            this.parentFadeR = 0;
            this.parentFadeG = 0;
            this.parentFadeB = 0;
            this.parentHasFade = false;
            this.fadeR = 0;
            this.fadeG = 0;
            this.fadeB = 0;
            this.hasFade = false;
        }
    }

    tick(): void {
        const shouldRemove = this.age >= this.lifetime;
        this.age++;

        if (shouldRemove) {
            return;
        }

        this.velocity.y -= 0.04 * this.gravity;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.z *= this.friction;

        if (this.age > this.lifetime / 2) {
            const halfLife = Math.floor(this.lifetime / 2);
            this.alpha = 1.0 - ((this.age - halfLife) / this.lifetime);

            if (this.parentHasFade) {
                this.rCol += (this.parentFadeR - this.rCol) * 0.2;
                this.gCol += (this.parentFadeG - this.gCol) * 0.2;
                this.bCol += (this.parentFadeB - this.bCol) * 0.2;
            }
        }
    }

    isDead(): boolean {
        return this.age >= this.lifetime;
    }

    shouldRender(): boolean {
        if (!this.hasTwinkle) return true;
        if (this.age < this.lifetime / 3) return true;
        return Math.floor((this.age + this.lifetime) / 3) % 2 === 0;
    }

    shouldSpawnTrail(): boolean {
        if (!this.hasTrail) return false;
        if (!(this.age < this.lifetime / 2)) return false;
        return (this.age + this.lifetime) % 2 === 0;
    }

    getColor(): THREE.Color {
        return new THREE.Color(this.rCol, this.gCol, this.bCol);
    }

    getAlpha(): number {
        return this.alpha;
    }

    getSpriteFrame(): number {
        const frame = Math.floor((this.age * 7) / this.lifetime);
        return Math.min(7, Math.max(0, frame));
    }
}