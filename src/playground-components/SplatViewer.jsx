import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';

export default function SplatViewer() {
    const [splatUrl, setSplatUrl] = useState('https://sparkjs.dev/assets/splats/butterfly.spz');
    const [fileType, setFileType] = useState('spz');
    const [fileBytes, setFileBytes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fps, setFps] = useState(0);
    const [viewMode, setViewMode] = useState('splat');
    const [modelKey, setModelKey] = useState(0);

    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setFileBytes(null);
        setModelKey(prev => prev + 1);

        try {
            const extension = file.name.split('.').pop().toLowerCase();
            setFileType(extension);
            const buffer = await file.arrayBuffer();
            setFileBytes(buffer);
            setSplatUrl(null);
        } catch (err) {
            setError("Error leyendo el archivo");
        }
    };

    const onLoadingStart = useCallback(() => setLoading(true), []);
    const onLoaded = useCallback(() => setLoading(false), []);
    const onErrorCallback = useCallback((msg) => {
        setError(msg);
        setLoading(false);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '600px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, display: 'flex', gap: '12px', alignItems: 'center', pointerEvents: 'auto', flexWrap: 'wrap' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' }}>
                    Subir .splat / .ply / .spz...
                </button>
                <input ref={fileInputRef} type="file" accept=".splat,.ply,.ksplat,.spz,.ply.gz" style={{ display: 'none' }} onChange={handleFileChange} />
                <button onClick={() => setViewMode('splat')} style={{ padding: '8px 16px', background: viewMode === 'splat' ? '#0a5' : '#444', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' }}>
                    Vista Normal (Splats)
                </button>
                <button onClick={() => setViewMode('points')} style={{ padding: '8px 16px', background: viewMode === 'points' ? '#0a5' : '#444', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' }}>
                    Vista Nube de Puntos
                </button>
                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.6)', color: '#0f0', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px' }}>
                    FPS: {fps}
                </div>
            </div>

            {(loading || error) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.7)', zIndex: 10, flexDirection: 'column', gap: '1rem' }}>
                    {loading && <div>Cargando...</div>}
                    {error && <div style={{ color: '#ff5555' }}>Error: {error}</div>}
                </div>
            )}

            <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }} dpr={[1, 1.5]} camera={{ position: [0, 1.6, 6], fov: 60 }}>
                <color attach="background" args={['#111111']} />
                <ambientLight intensity={1.3} />
                <FpsTracker setFps={setFps} />
                <Suspense fallback={null}>
                    <SplatOrPointsScene
                        key={`${splatUrl}-${modelKey}`}
                        url={splatUrl}
                        fileBytes={fileBytes}
                        fileType={fileType}
                        viewMode={viewMode}
                        onLoadingStart={onLoadingStart}
                        onLoaded={onLoaded}
                        onError={onErrorCallback}
                    />
                    <OrbitControls enableDamping dampingFactor={0.08} rotateSpeed={0.7} zoomSpeed={1.1} minDistance={0.4} maxDistance={120} />
                </Suspense>
            </Canvas>
        </div>
    );
}

function SplatOrPointsScene({ url, fileBytes, fileType, viewMode, onLoadingStart, onLoaded, onError }) {
    const [splatMesh, setSplatMesh] = useState(null);
    const [splatData, setSplatData] = useState(null);

    const dotTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }, []);

    const uniforms = useRef({
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uTexture: { value: dotTexture }
    });

    useEffect(() => {
        if (!url && !fileBytes) return;
        onLoadingStart?.();

        let mesh;
        try {
            mesh = new SplatMesh({
                url: url || undefined,
                fileBytes: fileBytes || undefined,
                fileType,
                onLoad: () => {
                    const num = mesh.numSplats;
                    if (num > 0) {
                        const limit = 500000;
                        const count = Math.min(num, limit);
                        const centers = new Float32Array(count * 3);
                        const colors = new Float32Array(count * 3);
                        let i = 0;
                        mesh.forEachSplat((index, center, scales, quaternion, opacity, color) => {
                            if (i >= count) return;
                            centers[i * 3] = center.x; centers[i * 3 + 1] = center.y; centers[i * 3 + 2] = center.z;
                            colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
                            i++;
                        });
                        setSplatData({ centers, colors });
                        setSplatMesh(mesh);
                        onLoaded?.();
                    }
                },
                sortMode: 'gpu',
                halfPrecision: true,
            });
        } catch (err) {
            console.error(err);
            onError?.(err.message || 'Error al cargar splat');
        }

        return () => {
            if (mesh) mesh.dispose?.();
        };
    }, []);

    const transitionFactor = useRef(0);
    useFrame((state, delta) => {
        const speed = 1.2;
        if (viewMode === 'points') transitionFactor.current = Math.min(transitionFactor.current + delta * speed, 1);
        else transitionFactor.current = Math.max(transitionFactor.current - delta * speed, 0);

        uniforms.current.uTime.value += delta;
        uniforms.current.uProgress.value = transitionFactor.current;

        if (splatMesh) {
            splatMesh.opacity = Math.pow(1.0 - transitionFactor.current, 1.5);
            splatMesh.visible = splatMesh.opacity > 0.001;
        }
    });

    const points = useMemo(() => {
        if (!splatData) return null;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(splatData.centers, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(splatData.colors, 3));

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms.current,
            transparent: true,
            depthWrite: true,
            alphaTest: 0.1,
            vertexShader: `
                varying vec3 vColor;
                varying float vAlpha;
                varying vec3 vPosition;
                uniform float uProgress;
                uniform float uTime;

                // Función hash para generar pseudo-aleatorio desde posición
                float hash(vec3 p) {
                  p = fract(p * 0.3183099 + 0.1);
                  p *= 17.0;
                  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
                }

                // Ease out cubic para suavidad
                float easeOutCubic(float t) {
                  return 1.0 - pow(1.0 - t, 3.0);
                }

                void main() {
                  vColor = color;
                  vPosition = position;
                  
                  // Generar delay pseudo-aleatorio basado en la posición
                  float randomDelay = hash(position) * 0.6;
                  
                  // Calcular progreso con delay aleatorio
                  float t = clamp((uProgress - randomDelay) / 0.4, 0.0, 1.0);
                  t = easeOutCubic(t);
                  
                  // Animación de escala con "pop"
                  float scale = t * (1.0 + 0.3 * sin(t * 3.14159));
                  
                  vAlpha = t;
                  
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  float size = 0.05 * scale * (120.0 / -mvPosition.z);
                  gl_PointSize = clamp(size, 0.1, 3.0);
                  gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                uniform sampler2D uTexture;
                void main() {
                  vec4 tex = texture2D(uTexture, gl_PointCoord);
                  if (tex.a < 0.1) discard;
                  gl_FragColor = vec4(vColor, tex.a * vAlpha * 0.85);
                }
            `,
            vertexColors: true,
        });

        const pts = new THREE.Points(geometry, material);
        pts.frustumCulled = false;
        return pts;
    }, [splatData]);

    useFrame(() => {
        if (points) {
            points.visible = transitionFactor.current > 0.001;
        }
    });

    return (
        <group>
            {splatMesh && <primitive object={splatMesh} />}
            {points && <primitive object={points} />}
        </group>
    );
}

function FpsTracker({ setFps }) {
    const frameTimes = useRef([]);
    useFrame(() => {
        const now = performance.now();
        frameTimes.current.push(now);
        while (frameTimes.current.length > 0 && now - frameTimes.current[0] > 1000) {
            frameTimes.current.shift();
        }
        if (frameTimes.current.length >= 10) {
            const elapsed = now - frameTimes.current[0];
            const newFps = Math.round((frameTimes.current.length / elapsed) * 1000);
            setFps(newFps);
        }
    });
    return null;
}
