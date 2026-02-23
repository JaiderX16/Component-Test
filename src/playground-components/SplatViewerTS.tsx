import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';

const IDLE_TIMEOUT = 4000;   // ms sin interacción antes de auto-rotar
const ROTATE_SPEED = 0.15;   // rad/s

interface ModelInfo {
    totalSplats: number;
    renderedSplats: number;
    fileType: string;
    fileSize: number | null;
    dimensions: string;
    avgScale: string;
    avgOpacity: string;
    sortMode: string;
    halfPrecision: boolean;
}

export default function SplatViewerTS() {
    const [splatUrl, setSplatUrl] = useState<string | null>('https://sparkjs.dev/assets/splats/butterfly.spz');
    const [fileType, setFileType] = useState('spz');
    const [fileBytes, setFileBytes] = useState<ArrayBuffer | null>(null);
    const [fileSize, setFileSize] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [orbitTarget, setOrbitTarget] = useState<[number, number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fps, setFps] = useState(0);
    const [viewMode, setViewMode] = useState<'splat' | 'points'>('splat');
    const [modelKey, setModelKey] = useState(0);
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

    // Performance state
    const [perfMode, setPerfMode] = useState<'AUTO' | 'MAX'>('AUTO');
    const [isMobile] = useState(() => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || /Mobi|Android/i.test(navigator.userAgent)));

    const [quality, setQuality] = useState(isMobile ? 'MED' : 'MAX');
    const [antialiasing] = useState(true);
    const [dpr, setDpr] = useState(typeof window !== 'undefined' ? window.devicePixelRatio : 2);
    const [splatLimit, setSplatLimit] = useState(isMobile ? 1500000 : 20000000);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraControlsRef = useRef<CameraControls>(null);
    const idleTimer = useRef(Date.now());

    // Lógica de Optimización Inteligente
    useEffect(() => {
        if (perfMode === 'AUTO' && fps > 0) {
            const nativeDPR = typeof window !== 'undefined' ? window.devicePixelRatio : 2;
            if (fps < 40) {
                setDpr(prev => Math.max(0.75, prev - 0.1));
                setQuality('LOW');
                if (isMobile) setSplatLimit(prev => Math.max(500000, prev - 100000));
            } else if (fps > 55) {
                setDpr(prev => Math.min(nativeDPR, prev + 0.05));
                setQuality(isMobile ? 'MED' : 'MAX');
            }
        }
    }, [fps, perfMode, isMobile]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setFileBytes(null);
        setModelInfo(null);
        setModelKey(prev => prev + 1);

        try {
            const extension = file.name.split('.').pop()?.toLowerCase() || 'splat';
            setFileType(extension);
            setFileSize(file.size);
            const buffer = await file.arrayBuffer();
            setFileBytes(buffer);
            setSplatUrl(null);
        } catch (err: any) {
            setError("Error leyendo el archivo");
        }
    };

    const formatBytes = (bytes: number | null) => {
        if (bytes == null) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    useEffect(() => {
        if (orbitTarget && cameraControlsRef.current) {
            cameraControlsRef.current.setTarget(
                orbitTarget[0], orbitTarget[1], orbitTarget[2], true
            );
        }
    }, [orbitTarget]);

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '600px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}
            onMouseDown={() => idleTimer.current = Date.now()}
            onTouchStart={() => idleTimer.current = Date.now()}
        >
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, display: 'flex', gap: '8px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Subir (TS)
                </button>
                <input ref={fileInputRef} type="file" accept=".splat,.ply,.ksplat,.spz" style={{ display: 'none' }} onChange={handleFileChange} />
                <button onClick={() => setViewMode(viewMode === 'splat' ? 'points' : 'splat')} style={{ padding: '6px 12px', background: '#444', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Modo: {viewMode === 'splat' ? 'Splat' : 'Puntos'}
                </button>
                <button
                    onClick={() => {
                        const next = perfMode === 'AUTO' ? 'MAX' : 'AUTO';
                        setPerfMode(next);
                        if (next === 'MAX') {
                            setDpr(window.devicePixelRatio);
                            setSplatLimit(20000000);
                            setQuality('MAX');
                        }
                    }}
                    style={{ padding: '6px 12px', background: perfMode === 'MAX' ? '#f50' : '#444', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    Perf: {perfMode}
                </button>
                {fps > 55 && fps < 65 && (
                    <div style={{ fontSize: '10px', color: '#888', maxWidth: '150px', lineHeight: '1.2' }}>
                        💡 Capado a 60? Usa <code style={{ color: '#aaa' }}>--disable-frame-rate-limit</code> en Chrome para +120
                    </div>
                )}
            </div>

            <div style={{
                position: 'absolute', bottom: 10, right: 10, zIndex: 20,
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                borderRadius: '8px', padding: '8px 12px',
                fontFamily: 'monospace', fontSize: '10px', color: '#ccc',
                pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{ color: '#0f0', fontWeight: 'bold', marginBottom: '4px' }}>FPS: {fps} (TS Version)</div>
                {modelInfo && (
                    <>
                        <div>Formato: {modelInfo.fileType}</div>
                        <div>Puntos: {modelInfo.renderedSplats.toLocaleString()}</div>
                        <div>Peso: {formatBytes(modelInfo.fileSize)}</div>
                        <div>Calidad: {quality}</div>
                    </>
                )}
            </div>

            {(loading || error) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.85)', zIndex: 100, flexDirection: 'column', gap: '8px' }}>
                    {loading && <div>Cargando Splat (TS)...</div>}
                    {error && <div style={{ color: '#f55' }}>Error: {error}</div>}
                </div>
            )}

            <Canvas gl={{ antialias: antialiasing, powerPreference: 'high-performance', alpha: true }} dpr={dpr} camera={{ position: [0, 1.6, -6], fov: 60 }}>
                <color attach="background" args={['#080808']} />
                <ambientLight intensity={1.5} />
                <gridHelper args={[20, 20, 0x333333, 0x111111]} />
                <FpsTracker setFps={setFps} />
                <Suspense fallback={null}>
                    <SplatOrPointsScene
                        key={`${splatUrl}-${modelKey}-${quality}`}
                        url={splatUrl}
                        fileBytes={fileBytes}
                        fileType={fileType}
                        viewMode={viewMode}
                        limit={splatLimit}
                        onLoadingStart={() => setLoading(true)}
                        onLoaded={() => setLoading(false)}
                        onError={(msg) => { setError(msg); setLoading(false); }}
                        onOrbitTarget={setOrbitTarget}
                        onModelInfo={setModelInfo}
                        fileSize={fileSize}
                    />
                    <CameraControls ref={cameraControlsRef as any} />
                    <AutoRotate cameraControlsRef={cameraControlsRef as any} idleTimer={idleTimer} />
                </Suspense>
            </Canvas>
        </div>
    );
}

interface SceneProps {
    url: string | null;
    fileBytes: ArrayBuffer | null;
    fileType: string;
    viewMode: 'splat' | 'points';
    limit: number;
    onLoadingStart?: () => void;
    onLoaded?: () => void;
    onError?: (msg: string) => void;
    onOrbitTarget?: (pos: [number, number, number]) => void;
    onModelInfo?: (info: ModelInfo) => void;
    fileSize: number | null;
}

function SplatOrPointsScene({ url, fileBytes, fileType, viewMode, limit, onLoadingStart, onLoaded, onError, onOrbitTarget, onModelInfo, fileSize }: SceneProps) {
    const [splatMesh, setSplatMesh] = useState<any>(null);
    const [splatData, setSplatData] = useState<{ centers: Float32Array, colors: Float32Array } | null>(null);
    const [centerOffset, setCenterOffset] = useState<[number, number, number]>([0, 0, 0]);

    const dotTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
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
        console.log("TS: Starting SplatMesh load...");
        onLoadingStart?.();

        let mesh: any;
        try {
            mesh = new SplatMesh({
                url: url || undefined,
                fileBytes: fileBytes || undefined,
                fileType: fileType as any,
                onLoad: () => {
                    console.log("TS: SplatMesh onLoad triggered");
                    const num = mesh.numSplats;
                    if (num > 0) {
                        // Instant Setup
                        setCenterOffset([0, 0, 0]);
                        onOrbitTarget?.([0, 0, 0]);

                        onModelInfo?.({
                            totalSplats: num,
                            renderedSplats: num,
                            fileType,
                            fileSize,
                            dimensions: "Auto-detecting...",
                            avgScale: "—",
                            avgOpacity: "—",
                            sortMode: 'GPU (Instant)',
                            halfPrecision: false,
                        });

                        setSplatMesh(mesh);
                        onLoaded?.();
                    }
                },
                sortMode: 'gpu',
                halfPrecision: false,
            } as any);
        } catch (err: any) {
            console.error("TS: Error in SplatMesh constructor", err);
            onError?.("Constructor error: " + err.message);
        }

        return () => { if (mesh) mesh.dispose?.(); };
    }, [url, fileBytes, fileType]);

    // Defer Point Cloud Generation (Lazy)
    useEffect(() => {
        if (viewMode === 'points' && splatMesh && !splatData) {
            const num = splatMesh.numSplats;
            const count = Math.min(num, limit);
            const centers = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            let i = 0;
            const processChunk = () => {
                const chunkSize = 50000;
                const end = Math.min(i + chunkSize, count);

                splatMesh.forEachSplat((index: number, center: any, scales: any, quaternion: any, opacity: number, color: any) => {
                    if (index < i || index >= end) return;
                    centers[index * 3] = center.x; centers[index * 3 + 1] = center.y; centers[index * 3 + 2] = center.z;
                    colors[index * 3] = color.r; colors[index * 3 + 1] = color.g; colors[index * 3 + 2] = color.b;
                });

                i = end;
                if (i < count) {
                    requestAnimationFrame(processChunk);
                } else {
                    setSplatData({ centers, colors });
                    console.log("TS: Points ready.");
                }
            };
            processChunk();
        }
    }, [viewMode, splatMesh, limit, splatData]);

    useFrame((_, delta) => {
        uniforms.current.uTime.value += delta;
        if (viewMode === 'points') uniforms.current.uProgress.value = Math.min(uniforms.current.uProgress.value + delta * 1.5, 1);
        else uniforms.current.uProgress.value = Math.max(uniforms.current.uProgress.value - delta * 1.5, 0);

        if (splatMesh) {
            splatMesh.opacity = Math.pow(1.0 - uniforms.current.uProgress.value, 1.5);
            splatMesh.visible = splatMesh.opacity > 0.01;
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
                uniform float uProgress;
                float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
                void main() {
                    vColor = color;
                    float rd = hash(position) * 0.6;
                    float t = clamp((uProgress - rd) / 0.4, 0.0, 1.0);
                    float sc = t * (1.0 + 0.2 * sin(t * 3.14159));
                    vAlpha = t;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = clamp(0.06 * sc * (120.0 / -mv.z), 0.1, 4.0);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                uniform sampler2D uTexture;
                void main() {
                    vec4 tex = texture2D(uTexture, gl_PointCoord);
                    if (tex.a < 0.1) discard;
                    gl_FragColor = vec4(vColor, tex.a * vAlpha);
                }
            `,
            vertexColors: true,
        });

        const pts = new THREE.Points(geometry, material);
        pts.frustumCulled = false;
        return pts;
    }, [splatData]);

    return (
        <group rotation={[0, 0, Math.PI]} position={centerOffset}>
            {splatMesh && <primitive object={splatMesh} />}
            {points && <primitive object={points} position={viewMode === 'points' ? [0, 0, 0] : [0, -1000, 0]} />}
        </group>
    );
}

function FpsTracker({ setFps }: { setFps: (n: number) => void }) {
    const frameTimes = useRef<number[]>([]);
    const lastTime = useRef(performance.now());

    useFrame(() => {
        const now = performance.now();
        const delta = now - lastTime.current;
        lastTime.current = now;

        frameTimes.current.push(delta);
        if (frameTimes.current.length > 60) frameTimes.current.shift();

        const avgDelta = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
        setFps(Math.round(1000 / avgDelta));
    });
    return null;
}

function AutoRotate({ cameraControlsRef, idleTimer }: { cameraControlsRef: React.RefObject<CameraControls | null>, idleTimer: React.MutableRefObject<number> }) {
    useFrame((_, delta) => {
        const controls = cameraControlsRef.current;
        if (controls && (Date.now() - idleTimer.current > IDLE_TIMEOUT)) {
            controls.azimuthAngle += ROTATE_SPEED * delta;
        }
    });
    return null;
}
