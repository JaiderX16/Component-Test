import React, { useState, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Upload, Layers, Loader2, Rotate3D, Zap, Settings2, FileImage, Plus } from 'lucide-react';

const ImageMesh = ({ imageUrl, depthUrl, displacementScale, wireframe }) => {
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);

    const colorMap = useLoader(THREE.TextureLoader, imageUrl);
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const depthMap = useLoader(THREE.TextureLoader, depthUrl || 'https://placehold.co/10x10/000000/000000.png');
    depthMap.minFilter = THREE.LinearFilter;
    depthMap.magFilter = THREE.LinearFilter;

    const { width, height } = colorMap.image || { width: 1, height: 1 };
    const aspectRatio = width / height;
    const args = [aspectRatio * 5, 5, 512, 512]; // Más segmentos para detalle suave

    useFrame((state) => {
        if (!meshRef.current) return;

        const targetRotY = hovered ? state.mouse.x * 0.25 + 0.4 : 0.4; // Giro más pronunciado por default
        const targetRotX = hovered ? -state.mouse.y * 0.15 : 0;

        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.08);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.08);
    });

    return (
        <mesh ref={meshRef} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} castShadow receiveShadow>
            <planeGeometry args={args} />
            <meshStandardMaterial
                map={colorMap}
                displacementMap={depthUrl ? depthMap : null}
                displacementScale={displacementScale}
                displacementBias={-displacementScale * 0.5} // Centra el desplazamiento (evita que todo se hunda)
                bumpMap={depthUrl ? depthMap : null}
                bumpScale={0.8} // Bump extra para microdetalle
                roughness={0.5}
                metalness={0.05}
                side={THREE.FrontSide}
                wireframe={wireframe}
            />
        </mesh>
    );
};

// Componente para los marcadores de lugares de interés
const Marker = ({ position, color = '#ff6b6b', label }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <group position={position}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                scale={hovered ? 1.3 : 1}
            >
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.8 : 0.4}
                    toneMapped={false}
                />
            </mesh>
            {/* Pin del marcador */}
            <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
};

export default function DepthAIViewer() {
    const [image, setImage] = useState(null);
    const [depthImage, setDepthImage] = useState(null);
    const [status, setStatus] = useState('idle');
    const [displacement, setDisplacement] = useState(4.5); // Valor más realista para retratos tipo LiDAR
    const [viewMode, setViewMode] = useState('3d');
    const [wireframe, setWireframe] = useState(false);
    const [markers, setMarkers] = useState([]); // Array de lugares de interés
    const [addingMode, setAddingMode] = useState(false); // Modo de agregar lugares

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImage(url);
            if (status !== 'manual_upload') {
                setDepthImage(null);
                setStatus('ready');
            }
        }
    };

    const handleDepthUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setDepthImage(url);
            setStatus('manual_upload');
        }
    };

    const simulateDepthMap = (imgUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Mejor contraste y enfoque en sujeto (simula LiDAR portrait)
                for (let i = 0; i < data.length; i += 4) {
                    let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Aumentar contraste drástico (sujeto más blanco = más cerca)
                    avg = Math.pow(avg / 255, 1.8) * 255; // Gamma + contraste
                    avg = Math.max(30, Math.min(225, avg)); // Evitar extremos puros
                    const inverted = 255 - avg; // Invertir: fondo oscuro → cerca blanco
                    data[i] = data[i + 1] = data[i + 2] = inverted;
                }

                ctx.putImageData(imageData, 0, 0);

                // Blur controlado + sharpen ligero para bordes más definidos
                ctx.filter = 'blur(4px)';
                ctx.drawImage(canvas, 0, 0);
                ctx.filter = 'none';
                ctx.drawImage(canvas, 0, 0);

                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imgUrl;
        });
    };

    const runDepthEstimation = async () => {
        if (!image) return;
        setStatus('loading');
        try {
            await new Promise(r => setTimeout(r, 800));
            setStatus('processing');
            await new Promise(r => setTimeout(r, 600));
            const fakeDepth = await simulateDepthMap(image);
            setDepthImage(fakeDepth);
            setStatus('done');
        } catch (error) {
            console.error("Error:", error);
            setStatus('error');
        }
    };

    // Función para agregar marcadores en la escena 3D
    const handleSceneClick = (event) => {
        if (!addingMode) return;

        // Obtener la posición del clic en el espacio 3D
        const newMarker = {
            id: Date.now(),
            position: [event.point.x, event.point.y, event.point.z],
            color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Color aleatorio
            label: `POI ${markers.length + 1}`
        };

        setMarkers([...markers, newMarker]);
        setAddingMode(false); // Desactivar modo después de agregar
    };

    return (
        <div style={{ width: '100%', background: '#171717', color: '#fff', fontFamily: 'system-ui, sans-serif', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #262626', background: 'rgba(10, 10, 10, 0.5)', backdropFilter: 'blur(10px)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers style={{ width: '20px', height: '20px', color: '#a855f7' }} />
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>DepthViewer<span style={{ color: '#737373' }}>3D</span></span>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', padding: '20px' }}>

                {/* Sidebar - Controls */}
                <div style={{ flex: '1 1 300px', minWidth: '280px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Input Section */}
                    <div style={{ background: 'rgba(38, 38, 38, 0.5)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(64, 64, 64, 0.5)' }}>
                        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#d4d4d4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileImage style={{ width: '16px', height: '16px' }} /> Entradas
                        </h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 500, color: '#a855f7', marginBottom: '4px', display: 'block' }}>1. Imagen Original</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', border: '1px solid #404040', borderRadius: '8px', cursor: 'pointer', background: 'rgba(10, 10, 10, 0.5)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(64, 64, 64, 0.5)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(10, 10, 10, 0.5)'}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: `1px solid ${image ? '#a855f7' : '#404040'}` }}>
                                    {image ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Upload style={{ width: '20px', height: '20px', color: '#737373' }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{image ? 'Imagen cargada' : 'Subir imagen...'}</p>
                                    <p style={{ fontSize: '11px', color: '#737373' }}>JPG, PNG</p>
                                </div>
                                <input type="file" style={{ display: 'none' }} onChange={handleImageUpload} accept="image/*" />
                            </label>
                        </div>

                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 500, color: '#a3a3a3', marginBottom: '4px', display: 'block' }}>2. Mapa de Profundidad</label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button onClick={runDepthEstimation} disabled={!image || status === 'loading' || status === 'processing'} style={{ padding: '12px 8px', borderRadius: '8px', fontWeight: 500, fontSize: '11px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', border: !image ? '1px solid #404040' : status === 'loading' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent', background: !image ? '#262626' : status === 'loading' ? 'rgba(88, 28, 135, 0.3)' : '#404040', color: !image ? '#525252' : status === 'loading' ? '#d8b4fe' : '#fff', cursor: !image ? 'not-allowed' : 'pointer' }}>
                                    {status === 'loading' || status === 'processing' ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Zap style={{ width: '16px', height: '16px' }} />}
                                    {status === 'loading' ? 'Generando...' : 'Generar IA'}
                                </button>

                                <label style={{ padding: '12px 8px', borderRadius: '8px', fontWeight: 500, fontSize: '11px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', border: depthImage && status === 'manual_upload' ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid transparent', background: depthImage && status === 'manual_upload' ? 'rgba(20, 83, 45, 0.3)' : '#404040', color: depthImage && status === 'manual_upload' ? '#86efac' : '#d4d4d4', cursor: 'pointer' }}>
                                    <Upload style={{ width: '16px', height: '16px' }} />
                                    <span>Subir Mapa</span>
                                    <input type="file" style={{ display: 'none' }} onChange={handleDepthUpload} accept="image/*" />
                                </label>
                            </div>

                            {depthImage && (
                                <div style={{ marginTop: '8px', height: '60px', width: '100%', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '4px', border: '1px solid #404040', overflow: 'hidden', position: 'relative' }}>
                                    <img src={depthImage} style={{ maxWidth: '100%', height: '100%', objectFit: 'contain', opacity: 0.5 }} alt="" />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#a3a3a3' }}>Vista Previa</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div style={{ background: 'rgba(38, 38, 38, 0.5)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(64, 64, 64, 0.5)', transition: 'all 0.3s', opacity: !image ? 0.5 : 1, pointerEvents: !image ? 'none' : 'auto' }}>
                        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#d4d4d4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings2 style={{ width: '16px', height: '16px' }} /> Ajustes
                        </h2>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, color: '#a3a3a3' }}>Profundidad (Extrusión)</label>
                                <span style={{ fontSize: '11px', color: '#a855f7', fontFamily: 'monospace' }}>{displacement.toFixed(1)}</span>
                            </div>
                            <input type="range" min="0" max="15" step="0.1" value={displacement} onChange={(e) => setDisplacement(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#a855f7', height: '8px', background: '#404040', borderRadius: '8px', cursor: 'pointer' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button onClick={() => setWireframe(!wireframe)} style={{ padding: '8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, border: wireframe ? '1px solid #a855f7' : '1px solid #404040', background: wireframe ? 'rgba(168, 85, 247, 0.2)' : '#262626', color: wireframe ? '#e9d5ff' : '#a3a3a3', transition: 'all 0.2s', cursor: 'pointer' }}>Wireframe</button>
                            <button onClick={() => setViewMode(viewMode === 'depth-only' ? '3d' : 'depth-only')} style={{ padding: '8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, border: viewMode === 'depth-only' ? '1px solid #3b82f6' : '1px solid #404040', background: viewMode === 'depth-only' ? 'rgba(59, 130, 246, 0.2)' : '#262626', color: viewMode === 'depth-only' ? '#bfdbfe' : '#a3a3a3', transition: 'all 0.2s', cursor: 'pointer' }}>Mapa 2D</button>
                        </div>
                    </div>
                </div>

                {/* Viewport - 3D Area */}
                <div style={{ flex: '2 1 500px', minHeight: '600px', background: '#000', borderRadius: '16px', border: '1px solid #262626', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

                    {/* Botón flotante para agregar lugares de interés */}
                    {image && (
                        <button
                            onClick={() => setAddingMode(!addingMode)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                zIndex: 100,
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                border: addingMode ? '2px solid #22c55e' : '2px solid #a855f7',
                                background: addingMode ? 'rgba(34, 197, 94, 0.9)' : 'rgba(168, 85, 247, 0.9)',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s',
                                boxShadow: addingMode ? '0 0 20px rgba(34, 197, 94, 0.6)' : '0 0 20px rgba(168, 85, 247, 0.4)',
                                backdropFilter: 'blur(10px)',
                                transform: addingMode ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                            }}
                            title={addingMode ? "Haz clic en el mapa para agregar" : "Agregar lugar de interés"}
                        >
                            <Plus style={{ width: '28px', height: '28px', strokeWidth: 3 }} />
                        </button>
                    )}

                    {/* Indicador de modo activo */}
                    {addingMode && (
                        <div style={{
                            position: 'absolute',
                            top: '80px',
                            right: '20px',
                            zIndex: 100,
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: 'rgba(34, 197, 94, 0.95)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(10px)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            Haz clic en el mapa para agregar
                        </div>
                    )}

                    {/* Contador de marcadores */}
                    {markers.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '20px',
                            zIndex: 100,
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: 'rgba(38, 38, 38, 0.95)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 500,
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            📍 {markers.length} lugar{markers.length !== 1 ? 'es' : ''} de interés
                        </div>
                    )}

                    {!image && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#525252', textAlign: 'center', userSelect: 'none' }}>
                            <Rotate3D style={{ width: '80px', height: '80px', marginBottom: '24px', opacity: 0.2 }} />
                            <p style={{ fontSize: '20px', fontWeight: 500, color: '#737373' }}>Visor 3D</p>
                            <p style={{ fontSize: '14px', maxWidth: '320px', marginTop: '8px', color: '#525252' }}>Sube una imagen y su mapa de profundidad para ver la magia.</p>
                        </div>
                    )}

                    {image && (
                        <div style={{ width: '100%', height: '100%', cursor: addingMode ? 'crosshair' : 'move', transition: 'opacity 0.5s', opacity: viewMode === 'depth-only' ? 0 : 1, pointerEvents: viewMode === 'depth-only' ? 'none' : 'auto' }}>
                            <Canvas shadows dpr={[1, 2]}>
                                <PerspectiveCamera makeDefault position={[0, 0, 3.2]} fov={45} />

                                <ambientLight intensity={0.3} />
                                <directionalLight
                                    position={[4, 5, 6]}
                                    intensity={2.2}
                                    color="#fffef0"
                                    castShadow
                                    shadow-mapSize-width={1024}
                                    shadow-mapSize-height={1024}
                                />
                                <directionalLight position={[-4, 4, -3]} intensity={1.2} color="#d0e0ff" />
                                <spotLight
                                    position={[0, 2, 5]}
                                    angle={0.4}
                                    penumbra={0.6}
                                    intensity={1.8}
                                    color="#ffffff"
                                    castShadow
                                />

                                <fog attach="fog" args={['#0a0a0a', 4, 12]} />

                                <Center>
                                    <React.Suspense fallback={null}>
                                        <ImageMesh
                                            imageUrl={image}
                                            depthUrl={depthImage}
                                            displacementScale={depthImage ? displacement : 0}
                                            wireframe={wireframe}
                                        />
                                    </React.Suspense>
                                </Center>

                                {/* Renderizar marcadores de lugares de interés */}
                                {markers.map((marker) => (
                                    <Marker
                                        key={marker.id}
                                        position={marker.position}
                                        color={marker.color}
                                        label={marker.label}
                                    />
                                ))}

                                {/* Plano invisible para detectar clics */}
                                {addingMode && (
                                    <mesh
                                        onClick={handleSceneClick}
                                        visible={false}
                                    >
                                        <planeGeometry args={[10, 10]} />
                                        <meshBasicMaterial transparent opacity={0} />
                                    </mesh>
                                )}

                                <OrbitControls
                                    enableZoom={true}
                                    enablePan={true}
                                    minDistance={1.8}
                                    maxDistance={6}
                                    dampingFactor={0.05}
                                    enabled={!addingMode} // Deshabilitar controles cuando está en modo agregar
                                />
                            </Canvas>
                        </div>
                    )}

                    {image && viewMode === 'depth-only' && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                            {depthImage ? (
                                <img src={depthImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid #404040' }} alt="" />
                            ) : (
                                <div style={{ color: '#737373', fontSize: '14px' }}>Aún no hay mapa de profundidad cargado.</div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
        </div>
    );
}