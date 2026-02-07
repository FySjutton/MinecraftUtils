import * as THREE from 'three';
import { FireworkParticle } from '@/app/generators/fireworks/base/particle';
import {createExplosion, FireworkExplosion} from '@/app/generators/fireworks/base/algorithms';

const MAX_PARTICLES = 5000;

export class FireworkScene {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: FireworkParticle[] = [];
    particlesMesh!: THREE.Points;
    animationId: number | null = null;
    lastTime = 0;
    randomRotation = false;
    tickAccumulator = 0;
    readonly TICK_INTERVAL = 1000 / 20;
    spriteTextures: THREE.Texture[] = [];
    texturesLoaded = false;

    private explosionScale = 0.8;
    private explosionOriginYPercent = 0.3;

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / Math.max(1, canvas.clientHeight), 0.1, 1000);
        this.updateCameraForScale();

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(dpr);

        const cssW = Math.max(1, canvas.clientWidth);
        const cssH = Math.max(1, canvas.clientHeight);
        this.renderer.setSize(cssW, cssH, false);
        this.renderer.domElement.style.width = `${cssW}px`;
        this.renderer.domElement.style.height = `${cssH}px`;

        this.loadTextures().then(() => this.initParticleSystem());
    }

    private updateCameraForScale(): void {
        const baseDistance = 10;
        const distance = baseDistance / this.explosionScale;

        this.camera.position.set(0, 0, distance);

        const lookAtY = -this.explosionOriginYPercent * distance * 0.5;
        this.camera.lookAt(0, lookAtY, 0);
    }

    private async loadTextures(): Promise<void> {
        const loader = new THREE.TextureLoader();
        const loadPromises: Promise<THREE.Texture>[] = [];
        for (let i = 0; i < 8; i++) {
            loadPromises.push(new Promise((resolve, reject) => {
                loader.load(`/assets/tool/fireworks/particles/spark_${i}.png`,
                    (tex) => {
                        tex.minFilter = THREE.NearestFilter;
                        tex.magFilter = THREE.NearestFilter;
                        tex.generateMipmaps = false;
                        resolve(tex);
                    }, undefined, reject);
            }));
        }
        try {
            this.spriteTextures = await Promise.all(loadPromises);
            this.texturesLoaded = true;
        } catch (e) {
            console.error('Failed to load textures:', e);
            this.texturesLoaded = false;
        }
    }

    private initParticleSystem(): void {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1));
        geometry.setAttribute('spriteFrame', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                spriteTextures: { value: this.spriteTextures },
                texturesLoaded: { value: this.texturesLoaded },
                uHeight: { value: this.renderer.domElement.height },
            },
            vertexShader: `
                attribute float alpha;
                attribute float size;
                attribute float spriteFrame;
                uniform float uHeight;
                varying vec3 vColor;
                varying float vAlpha;
                varying float vSpriteFrame;
                void main() {
                    vColor = color;
                    vAlpha = alpha;
                    vSpriteFrame = spriteFrame;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    gl_PointSize = size * uHeight * 1.1 / -mvPosition.z; // CHANGE HERE, the 1.1 adjusts particle size
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D spriteTextures[8];
                uniform bool texturesLoaded;
                varying vec3 vColor;
                varying float vAlpha;
                varying float vSpriteFrame;
                void main() {
                    if (texturesLoaded) {
                        vec4 texColor;
                        int frame = int(vSpriteFrame);
                        if (frame == 0) texColor = texture2D(spriteTextures[0], gl_PointCoord);
                        else if (frame == 1) texColor = texture2D(spriteTextures[1], gl_PointCoord);
                        else if (frame == 2) texColor = texture2D(spriteTextures[2], gl_PointCoord);
                        else if (frame == 3) texColor = texture2D(spriteTextures[3], gl_PointCoord);
                        else if (frame == 4) texColor = texture2D(spriteTextures[4], gl_PointCoord);
                        else if (frame == 5) texColor = texture2D(spriteTextures[5], gl_PointCoord);
                        else if (frame == 6) texColor = texture2D(spriteTextures[6], gl_PointCoord);
                        else texColor = texture2D(spriteTextures[7], gl_PointCoord);
                        vec3 finalColor = texColor.rgb * vColor;
                        float finalAlpha = texColor.a * vAlpha;
                        if (finalAlpha < 0.01) discard;
                        gl_FragColor = vec4(finalColor, finalAlpha);
                    } else {
                        vec2 center = gl_PointCoord - vec2(0.5);
                        if (length(center) > 0.5) discard;
                        float glow = 1.0 - smoothstep(0.0, 0.5, length(center));
                        gl_FragColor = vec4(vColor, vAlpha * glow);
                    }
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });

        this.particlesMesh = new THREE.Points(geometry, material);
        this.scene.add(this.particlesMesh);
    }

    setRandomRotation(enabled: boolean): void {
        this.randomRotation = enabled;
    }

    launchFirework(explosion: FireworkExplosion): void {
        const origin = new THREE.Vector3(0, 0, 0);
        const newParticles = createExplosion(explosion, origin, this.randomRotation);
        this.particles.push(...newParticles);
        if (this.particles.length > MAX_PARTICLES) {
            this.particles = this.particles.slice(-MAX_PARTICLES);
        }
    }

    private update(deltaTime: number): void {
        this.tickAccumulator += deltaTime * 1000;
        while (this.tickAccumulator >= this.TICK_INTERVAL) {
            this.tickAccumulator -= this.TICK_INTERVAL;
            this.processTick();
        }
        this.updateGeometry();
    }

    private processTick(): void {
        const trailsToAdd: FireworkParticle[] = [];

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            if (particle.shouldSpawnTrail()) {
                const trail = new FireworkParticle(
                    particle.position.clone(),
                    new THREE.Vector3(0, 0, 0),
                    0,
                    null,
                    false,
                    particle.hasTwinkle
                );

                trail.alpha = 0.99;
                trail.rCol = particle.rCol;
                trail.gCol = particle.gCol;
                trail.bCol = particle.bCol;
                trail.age = Math.floor(trail.lifetime / 2);

                trailsToAdd.push(trail);
            }

            particle.tick();

            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }

        this.particles.push(...trailsToAdd);
    }

    private updateGeometry(): void {
        if (!this.particlesMesh) return;
        const geo = this.particlesMesh.geometry;
        const pos = geo.attributes.position.array as Float32Array;
        const col = geo.attributes.color.array as Float32Array;
        const alp = geo.attributes.alpha.array as Float32Array;
        const siz = geo.attributes.size.array as Float32Array;
        const spr = geo.attributes.spriteFrame.array as Float32Array;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.shouldRender()) {
                pos[i * 3] = p.position.x;
                pos[i * 3 + 1] = p.position.y;
                pos[i * 3 + 2] = p.position.z;
                const c = p.getColor();
                col[i * 3] = c.r;
                col[i * 3 + 1] = c.g;
                col[i * 3 + 2] = c.b;
                alp[i] = p.getAlpha();
                siz[i] = p.quadSize;
                spr[i] = p.getSpriteFrame();
            } else {
                alp[i] = 0;
            }
        }

        for (let i = this.particles.length; i < MAX_PARTICLES; i++) {
            alp[i] = 0;
        }

        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        geo.attributes.alpha.needsUpdate = true;
        geo.attributes.size.needsUpdate = true;
        geo.attributes.spriteFrame.needsUpdate = true;
        geo.setDrawRange(0, this.particles.length);
    }

    private animate = (): void => {
        this.animationId = requestAnimationFrame(this.animate);
        const now = performance.now();
        const dt = this.lastTime ? (now - this.lastTime) / 1000 : 0;
        this.lastTime = now;
        this.update(Math.min(dt, 0.1));
        this.renderer.render(this.scene, this.camera);
    };

    start(): void {
        if (!this.animationId) {
            this.lastTime = performance.now();
            this.animate();
        }
    }

    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleResize(w: number, h: number): void {
        const cssW = Math.max(1, Math.floor(w));
        const cssH = Math.max(1, Math.floor(h));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.camera.aspect = cssW / cssH;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(cssW, cssH, false);
        this.renderer.domElement.style.width = `${cssW}px`;
        this.renderer.domElement.style.height = `${cssH}px`;

        if (this.particlesMesh && this.particlesMesh.material instanceof THREE.ShaderMaterial) {
            this.particlesMesh.material.uniforms.uHeight.value = this.renderer.domElement.height;
        }
    }

    dispose(): void {
        this.stop();
        this.renderer.dispose();
        if (this.particlesMesh) {
            this.particlesMesh.geometry.dispose();
            if (this.particlesMesh.material instanceof THREE.Material) {
                this.particlesMesh.material.dispose();
            }
        }
        this.spriteTextures.forEach(t => t.dispose());
    }

    getParticleCount(): number {
        return this.particles.length;
    }
}