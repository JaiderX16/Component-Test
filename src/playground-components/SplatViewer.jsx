import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';

const IDLE_TIMEOUT = 4000;   // ms sin interacción antes de auto-rotar
const ROTATE_SPEED = 0.15;   // rad/s

export default function SplatViewer() {
    const [splatUrl, setSplatUrl] = useState('https://sparkjs.dev/assets/splats/butterfly.spz');
    const [fileType, setFileType] = useState('spz');
    const [fileBytes, setFileBytes] = useState(null);
    const [fileSize, setFileSize] = useState(null);
    const [loading, setLoading] = useState(false);
    const [orbitTarget, setOrbitTarget] = useState(null);
    const [error, setError] = useState(null);
    const [fps, setFps] = useState(0);
    const [viewMode, setViewMode] = useState('splat');
    const [modelKey, setModelKey] = useState(0);
    const [modelInfo, setModelInfo] = useState(null);

    // Performance state
    const [perfMode, setPerfMode] = useState('AUTO'); // 'AUTO' o 'MAX'
    const [isMobile] = useState(() => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || /Mobi|Android/i.test(navigator.userAgent)));

    const [quality, setQuality] = useState(isMobile ? 'MED' : 'MAX');
    const [antialiasing, setAntialiasing] = useState(true);
    const [dpr, setDpr] = useState(typeof window !== 'undefined' ? window.devicePixelRatio : 2);
    const [splatLimit, setSplatLimit] = useState(isMobile ? 1500000 : 20000000);

    const fileInputRef = useRef(null);
    const cameraControlsRef = useRef(null);
    const idleTimer = useRef(Date.now());

    // Lógica de Optimización Inteligente (solo en modo AUTO)
    useEffect(() => {
        if (perfMode === 'AUTO' && fps > 0) {
            const nativeDPR = typeof window !== 'undefined' ? window.devicePixelRatio : 2;

            if (fps < 40) {
                // Si el rendimiento cae, bajar DPR y límite progresivamente
                setDpr(prev => Math.max(0.75, prev - 0.1));
                setQuality('LOW');
                if (isMobile) setSplatLimit(Math.max(500000, splatLimit - 100000));
            } else if (fps > 55) {
                // Si el rendimiento es excelente, intentar subir a nativo
                setDpr(prev => Math.min(nativeDPR, prev + 0.05));
                setQuality(isMobile ? 'MED' : 'MAX');
            }
        }
    }, [fps, perfMode, isMobile, splatLimit]);



    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setFileBytes(null);
        setModelInfo(null);
        setModelKey(prev => prev + 1);

        try {
            const extension = file.name.split('.').pop().toLowerCase();
            setFileType(extension);
            setFileSize(file.size);
            const buffer = await file.arrayBuffer();
            setFileBytes(buffer);
            setSplatUrl(null);
        } catch (err) {
            setError("Error leyendo el archivo");
        }
    };

    const formatBytes = (bytes) => {
        if (bytes == null) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const onLoadingStart = useCallback(() => setLoading(true), []);
    const onLoaded = useCallback(() => setLoading(false), []);
    const onErrorCallback = useCallback((msg) => {
        setError(msg);
        setLoading(false);
    }, []);

    // Cuando se calcula el centro de masa, mover el target de la cámara para orbitar ahí
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
            onMouseMove={() => idleTimer.current = Date.now()}
            onWheel={() => idleTimer.current = Date.now()}
            onTouchStart={() => idleTimer.current = Date.now()}
            onTouchMove={() => idleTimer.current = Date.now()}
        >
            {/* ── Toolbar superior ── */}
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
                <button onClick={() => cameraControlsRef.current?.reset(true)} style={{ padding: '8px 16px', background: '#444', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' }}>
                    Reset Camera
                </button>
                <button
                    onClick={() => {
                        const newMode = perfMode === 'AUTO' ? 'MAX' : 'AUTO';
                        setPerfMode(newMode);
                        if (newMode === 'MAX') {
                            setDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 2);
                            setSplatLimit(20000000);
                            setQuality('MAX');
                        }
                    }}
                    style={{
                        padding: '8px 16px',
                        background: perfMode === 'MAX' ? '#f50' : '#444',
                        color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Modo: {perfMode}
                </button>
                {fps > 55 && fps < 65 && (
                    <div style={{ fontSize: '11px', color: '#888', maxWidth: '160px', lineHeight: '1.2' }}>
                        💡 Capado a 60? Usa <code style={{ color: '#aaa' }}>--disable-frame-rate-limit</code> en Chrome para +120
                    </div>
                )}
            </div>

            {/* ── Panel de estadísticas (abajo-derecha) ── */}
            <div style={{
                position: 'absolute', bottom: 10, right: 10, zIndex: 20,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                borderRadius: '10px', padding: '10px 14px',
                fontFamily: 'monospace', fontSize: '12px', color: '#ccc',
                lineHeight: 1.7, minWidth: '220px', pointerEvents: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#0f0', fontWeight: 700, fontSize: 14 }}>FPS: {fps}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {isMobile && <span style={{ padding: '1px 6px', background: '#333', borderRadius: 4, fontSize: 10, color: '#aaa' }}>MOBILE</span>}
                        <span style={{
                            padding: '1px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11,
                            background: quality === 'MAX' ? '#0a5' : quality === 'MED' ? '#c80' : '#c33',
                            color: '#fff',
                        }}>{quality}</span>
                    </div>
                </div>
                {modelInfo && (
                    <>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                        <div><span style={{ color: '#888' }}>Formato:</span> .{modelInfo.fileType}</div>
                        <div><span style={{ color: '#888' }}>Peso:</span> {formatBytes(modelInfo.fileSize)}</div>
                        <div><span style={{ color: '#888' }}>Puntos totales:</span> {modelInfo.totalSplats?.toLocaleString()}</div>
                        <div><span style={{ color: '#888' }}>Puntos renderizados:</span> {modelInfo.renderedSplats?.toLocaleString()}</div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                        <div><span style={{ color: '#888' }}>Dimensiones (m):</span> {modelInfo.dimensions}</div>
                        <div><span style={{ color: '#888' }}>Escala prom.:</span> {modelInfo.avgScale}</div>
                        <div><span style={{ color: '#888' }}>Opacidad prom.:</span> {modelInfo.avgOpacity}</div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                        <div><span style={{ color: '#888' }}>Sort:</span> {modelInfo.sortMode}</div>
                        <div><span style={{ color: '#888' }}>Half Precision:</span> {modelInfo.halfPrecision ? 'Sí' : 'No'}</div>
                        <div><span style={{ color: '#888' }}>DPR:</span> {Array.isArray(dpr) ? dpr.join(' – ') : dpr}</div>
                        <div><span style={{ color: '#888' }}>Antialiasing:</span> {antialiasing ? 'Sí' : 'No'}</div>
                    </>
                )}
            </div>

            {(loading || error) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.7)', zIndex: 10, flexDirection: 'column', gap: '1rem' }}>
                    {loading && <div>Cargando...</div>}
                    {error && <div style={{ color: '#ff5555' }}>Error: {error}</div>}
                </div>
            )}

            <Canvas gl={{ antialias: antialiasing, powerPreference: 'high-performance', alpha: true }} dpr={dpr} camera={{ position: [0, 1.6, -6], fov: 60 }}>
                <color attach="background" args={['#111111']} />
                <ambientLight intensity={1.3} />
                <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[0, 0, 0]} />
                <axesHelper args={[2]} position={[0, 0.1, 0]} />
                <FpsTracker setFps={setFps} />
                <Suspense fallback={null}>
                    <SplatOrPointsScene
                        key={`${splatUrl}-${modelKey}`} // Solo remontar si cambia el modelo o se fuerza reset
                        url={splatUrl}
                        fileBytes={fileBytes}
                        fileType={fileType}
                        viewMode={viewMode}
                        limit={splatLimit}
                        onLoadingStart={onLoadingStart}
                        onLoaded={onLoaded}
                        onError={onErrorCallback}
                        onOrbitTarget={setOrbitTarget}
                        onModelInfo={setModelInfo}
                        fileSize={fileSize}
                    />
                    <CameraControls
                        ref={cameraControlsRef}
                        dollySpeed={0.8}
                        minDistance={0.4}
                        maxDistance={120}
                        smoothTime={0.25}
                    />
                    <AutoRotate cameraControlsRef={cameraControlsRef} idleTimer={idleTimer} />
                </Suspense>
            </Canvas>
        </div>
    );
}

function SplatOrPointsScene({ url, fileBytes, fileType, viewMode, limit, onLoadingStart, onLoaded, onError, onOrbitTarget, onModelInfo, fileSize }) {
    const [splatMesh, setSplatMesh] = useState(null);
    const [splatData, setSplatData] = useState(null);
    const [centerOffset, setCenterOffset] = useState([0, 0, 0]);

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
                        // Carga instantánea: No procesamos puntos aquí para no bloquear el hilo principal.
                        // Usamos los metadatos básicos del mesh.

                        // Centrado ligero (usando bounding box si está disponible, o centro por defecto)
                        // La mayoría de los splats ya vienen centrados o la librería maneja el bounding volume.
                        // Si no, podemos calcularlo de forma diferida.
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
            });
        } catch (err) {
            console.error(err);
            onError?.(err.message || 'Error al cargar splat');
        }

        return () => {
            if (mesh) mesh.dispose?.();
        };
    }, [url, fileBytes, fileType]); // Eliminado 'limit' de aquí para no recargar el mesh completo si cambia el límite

    // Efecto separado para generar la nube de puntos SOLO si es necesario (Lazy Loading)
    useEffect(() => {
        if (viewMode === 'points' && splatMesh && !splatData) {
            console.log("Generando nube de puntos en segundo plano...");
            const num = splatMesh.numSplats;
            const count = Math.min(num, limit);
            const centers = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            // Procesamiento por chunks para no bloquear totalmente la UI
            let i = 0;
            const processChunk = () => {
                const chunkSize = 50000;
                const end = Math.min(i + chunkSize, count);

                // NOTA: react-three-gaussian-splat / sparkjs suele tener métodos internos,
                // pero si usamos forEachSplat, lo hacemos en trozos.
                splatMesh.forEachSplat((index, center, scales, quaternion, opacity, color) => {
                    if (index < i || index >= end) return;
                    centers[index * 3] = center.x; centers[index * 3 + 1] = center.y; centers[index * 3 + 2] = center.z;
                    colors[index * 3] = color.r; colors[index * 3 + 1] = color.g; colors[index * 3 + 2] = color.b;
                });

                i = end;
                if (i < count) {
                    requestAnimationFrame(processChunk);
                } else {
                    setSplatData({ centers, colors });
                    console.log("Nube de puntos lista.");
                }
            };
            processChunk();
        }
    }, [viewMode, splatMesh, limit, splatData]);

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
        <group rotation={[0, 0, Math.PI]} position={centerOffset}>
            {splatMesh && <primitive object={splatMesh} />}
            {points && <primitive object={points} />}
        </group>
    );
}

function FpsTracker({ setFps }) {
    const frameTimes = useRef([]);
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

// Auto-rotación cuando el usuario no interactúa por un tiempo
function AutoRotate({ cameraControlsRef, idleTimer }) {
    useFrame((_, delta) => {
        const controls = cameraControlsRef.current;
        if (!controls) return;

        const elapsed = Date.now() - idleTimer.current;
        if (elapsed > IDLE_TIMEOUT) {
            // Girar azimut (eje Y) suavemente
            controls.azimuthAngle += ROTATE_SPEED * delta;
        }
    });
    return null;
}
