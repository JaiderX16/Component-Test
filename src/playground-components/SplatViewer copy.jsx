import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
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
    const [isMobile, setIsMobile] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

            <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }} dpr={[1, 1.5]} camera={{ position: [0, 0.5, 6], fov: 60 }}>
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
                    <FirstPersonControls isMobile={isMobile} />
                </Suspense>
            </Canvas>

            {/* Crosshair (Mira) en el centro */}
            <Crosshair />

            {isMobile && <VirtualJoystick />}
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
        uMaxDistance: { value: 10 },
        uTexture: { value: dotTexture }
    });

    useEffect(() => {
        if (!url && !fileBytes) return;
        onLoadingStart?.();

        let mesh;
        try {
            // Clonar el ArrayBuffer para evitar el error de "already detached"
            const bytesToUse = fileBytes ? fileBytes.slice(0) : undefined;

            mesh = new SplatMesh({
                url: url || undefined,
                fileBytes: bytesToUse,
                fileType,
                onLoad: () => {
                    const num = mesh.numSplats;
                    if (num > 0) {
                        const limit = 500000;
                        const count = Math.min(num, limit);
                        const centers = new Float32Array(count * 3);
                        const colors = new Float32Array(count * 3);
                        const distances = new Float32Array(count);
                        let maxDist = 0.001;
                        let i = 0;
                        mesh.forEachSplat((index, center, scales, quaternion, opacity, color) => {
                            if (i >= count) return;
                            centers[i * 3] = center.x; centers[i * 3 + 1] = center.y; centers[i * 3 + 2] = center.z;
                            colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
                            const d = center.length();
                            distances[i] = d;
                            if (d > maxDist) maxDist = d;
                            i++;
                        });
                        uniforms.current.uMaxDistance.value = maxDist;
                        setSplatData({ centers, colors, distances });
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
    }, []); // Key external remount

    const transitionFactor = useRef(0);
    useFrame((state, delta) => {
        const speed = 2.0;
        if (viewMode === 'points') transitionFactor.current = Math.min(transitionFactor.current + delta * speed, 1);
        else transitionFactor.current = Math.max(transitionFactor.current - delta * speed, 0);

        uniforms.current.uTime.value += delta;
        uniforms.current.uProgress.value = transitionFactor.current * 2.5;

        if (splatMesh) {
            splatMesh.opacity = Math.pow(1.0 - transitionFactor.current, 2.0);
            splatMesh.visible = splatMesh.opacity > 0.001;
        }
    });

    const points = useMemo(() => {
        if (!splatData) return null;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(splatData.centers, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(splatData.colors, 3));
        geometry.setAttribute('aDistance', new THREE.BufferAttribute(splatData.distances, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms.current,
            transparent: true,
            depthWrite: true,
            alphaTest: 0.1,
            vertexShader: `
                attribute float aDistance;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uProgress;
                uniform float uMaxDistance;

                float easeOutElastic(float t) {
                  float p = 0.3;
                  return pow(2.0, -10.0 * t) * sin((t - p / 4.0) * (2.0 * 3.14159) / p) + 1.0;
                }

                void main() {
                  vColor = color;
                  float delay = (aDistance / uMaxDistance) * 1.5;
                  float t = clamp(uProgress - delay, 0.0, 1.0);
                  float scale = 0.0;
                  if (t > 0.0) scale = easeOutElastic(t);
                  vAlpha = clamp(t * 1.5, 0.0, 1.0);
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  float size = 0.5 * scale * (120.0 / -mvPosition.z);
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
                  gl_FragColor = vec4(vColor, tex.a * vAlpha * 0.8);
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
        <group rotation={[Math.PI, 0, 0]}>
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

// Componente de controles de primera persona
function FirstPersonControls({ isMobile }) {
    const { camera, gl } = useThree();
    const controlsRef = useRef();
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const moveState = useRef({ forward: false, backward: false, left: false, right: false, up: false, down: false });

    // Variables para joystick móvil (se actualizarán desde el componente VirtualJoystick)
    const joystickState = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Listener para joystick móvil
        const handleJoystickMove = (e) => {
            joystickState.current = { x: e.detail.x, y: e.detail.y };
        };
        window.addEventListener('joystick-move', handleJoystickMove);

        if (!isMobile) {
            // Controles de teclado solo en PC
            const handleKeyDown = (e) => {
                switch (e.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        moveState.current.forward = true;
                        break;
                    case 'KeyS':
                    case 'ArrowDown':
                        moveState.current.backward = true;
                        break;
                    case 'KeyA':
                    case 'ArrowLeft':
                        moveState.current.left = true;
                        break;
                    case 'KeyD':
                    case 'ArrowRight':
                        moveState.current.right = true;
                        break;
                    case 'Space':
                        moveState.current.up = true;
                        e.preventDefault();
                        break;
                    case 'ShiftLeft':
                    case 'ShiftRight':
                        moveState.current.down = true;
                        break;
                }
            };

            const handleKeyUp = (e) => {
                switch (e.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        moveState.current.forward = false;
                        break;
                    case 'KeyS':
                    case 'ArrowDown':
                        moveState.current.backward = false;
                        break;
                    case 'KeyA':
                    case 'ArrowLeft':
                        moveState.current.left = false;
                        break;
                    case 'KeyD':
                    case 'ArrowRight':
                        moveState.current.right = false;
                        break;
                    case 'Space':
                        moveState.current.up = false;
                        break;
                    case 'ShiftLeft':
                    case 'ShiftRight':
                        moveState.current.down = false;
                        break;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keyup', handleKeyUp);
                window.removeEventListener('joystick-move', handleJoystickMove);
            };
        }

        return () => {
            window.removeEventListener('joystick-move', handleJoystickMove);
        };
    }, [isMobile]);

    useFrame((state, delta) => {
        const speed = 0.2; // Velocidad reducida para movimiento más controlado
        const minHeight = 0.3; // Altura mínima del suelo
        const dampingFactor = 8.0; // Reducido para más inercia

        // Aplicar velocidad con amortiguamiento más suave
        velocity.current.x -= velocity.current.x * dampingFactor * delta;
        velocity.current.z -= velocity.current.z * dampingFactor * delta;
        velocity.current.y -= velocity.current.y * dampingFactor * delta;

        direction.current.set(0, 0, 0);

        if (isMobile) {
            // Usar joystick en móviles
            if (Math.abs(joystickState.current.x) > 0.1 || Math.abs(joystickState.current.y) > 0.1) {
                direction.current.z = joystickState.current.y;
                direction.current.x = -joystickState.current.x; // Invertido para corregir controles
            }
        } else {
            // Usar teclado en PC (controles corregidos)
            if (moveState.current.forward) direction.current.z = 1;
            if (moveState.current.backward) direction.current.z = -1;
            if (moveState.current.left) direction.current.x = -1; // Invertido
            if (moveState.current.right) direction.current.x = 1; // Invertido
            if (moveState.current.up) direction.current.y = 1;
            if (moveState.current.down) direction.current.y = -1;
        }

        if (direction.current.length() > 0) {
            direction.current.normalize();
        }

        // Calcular movimiento en base a la orientación de la cámara
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        velocity.current.add(forward.multiplyScalar(direction.current.z * speed * delta));
        velocity.current.add(right.multiplyScalar(direction.current.x * speed * delta));
        velocity.current.y += direction.current.y * speed * delta;

        // Aplicar movimiento
        camera.position.add(velocity.current);

        // Limitar altura mínima (no atravesar el suelo)
        if (camera.position.y < minHeight) {
            camera.position.y = minHeight;
            velocity.current.y = 0;
        }
    });

    return isMobile ? null : <PointerLockControls ref={controlsRef} />;
}

// Componente de joystick virtual para móviles
function VirtualJoystick() {
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [origin, setOrigin] = useState({ x: 0, y: 0 });
    const touchId = useRef(null);

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        touchId.current = touch.identifier;
        const x = touch.clientX;
        const y = touch.clientY;
        setOrigin({ x, y });
        setPosition({ x, y });
        setActive(true);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const touch = Array.from(e.touches).find(t => t.identifier === touchId.current);
        if (!touch) return;

        const x = touch.clientX;
        const y = touch.clientY;
        setPosition({ x, y });

        // Calcular dirección normalizada
        const dx = x - origin.x;
        const dy = y - origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 60;
        const normalizedX = distance > maxDistance ? (dx / distance) * maxDistance : dx;
        const normalizedY = distance > maxDistance ? (dy / distance) * maxDistance : dy;

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('joystick-move', {
            detail: {
                x: normalizedX / maxDistance,
                y: normalizedY / maxDistance
            }
        }));
    };

    const handleTouchEnd = (e) => {
        const ended = Array.from(e.changedTouches).some(t => t.identifier === touchId.current);
        if (ended) {
            setActive(false);
            touchId.current = null;
            window.dispatchEvent(new CustomEvent('joystick-move', { detail: { x: 0, y: 0 } }));
        }
    };

    const dx = position.x - origin.x;
    const dy = position.y - origin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 60;
    const stickX = distance > maxDistance ? (dx / distance) * maxDistance : dx;
    const stickY = distance > maxDistance ? (dy / distance) * maxDistance : dy;

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                width: '150px',
                height: '150px',
                zIndex: 1000,
                touchAction: 'none',
            }}
        >
            {active && (
                <>
                    <div style={{
                        position: 'absolute',
                        left: `${origin.x - 75}px`,
                        top: `${origin.y - 75}px`,
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: `${origin.x + stickX - 30}px`,
                        top: `${origin.y + stickY - 30}px`,
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: '3px solid rgba(255, 255, 255, 0.8)',
                        pointerEvents: 'none',
                    }} />
                </>
            )}
        </div>
    );
}

// Componente de crosshair (mira) en el centro de la pantalla
function Crosshair() {
    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100,
        }}>
            {/* Cruz central */}
            <div style={{
                position: 'relative',
                width: '30px',
                height: '30px',
            }}>
                {/* Línea horizontal */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0',
                    width: '100%',
                    height: '2px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    transform: 'translateY(-50%)',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                }} />
                {/* Línea vertical */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '0',
                    height: '100%',
                    width: '2px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                }} />
                {/* Punto central */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(0, 255, 0, 0.9)',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 6px rgba(0, 255, 0, 0.6)',
                }} />
            </div>
        </div>
    );
}
