import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Fingerprint, Heart, Hexagon, CircleDashed, Loader2, Maximize2, Zap, Bone } from 'lucide-react';

// ==========================================
// 1. CONFIGURACIÓN Y CONSTANTES
// ==========================================
const PARTICLE_COUNT = 4000;
const INTERACTION_RADIUS = 3.5;
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// ==========================================
// 2. GENERADOR DE FORMAS (Lógica Matemática)
// ==========================================
const generateShapes = (count) => {
    const shapes = {
        sphere: [],
        heart: [],
        saturn: [],
        cube: [],
        twist: []
    };

    for (let i = 0; i < count; i++) {
        // A. SPHERE
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 3.5 * Math.cbrt(Math.random());
        shapes.sphere.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );

        // B. HEART
        const t = Math.random() * Math.PI * 2;
        const scale = 0.15;
        const xH = 16 * Math.pow(Math.sin(t), 3);
        const yH = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const zH = (Math.random() - 0.5) * 4;
        shapes.heart.push(xH * scale, yH * scale + 1, zH);

        // C. SATURN
        const isRing = Math.random() > 0.4;
        if (isRing) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 4 + Math.random() * 2;
            shapes.saturn.push(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.2,
                Math.sin(angle) * radius
            );
        } else {
            const rS = 2 * Math.cbrt(Math.random());
            const thetaS = Math.random() * Math.PI * 2;
            const phiS = Math.acos(2 * Math.random() - 1);
            shapes.saturn.push(
                rS * Math.sin(phiS) * Math.cos(thetaS),
                rS * Math.sin(phiS) * Math.sin(thetaS),
                rS * Math.cos(phiS)
            );
        }

        // D. CUBE
        const size = 4;
        shapes.cube.push(
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size
        );

        // E. TWIST
        const h = (Math.random() - 0.5) * 8;
        const twistRad = 2;
        const twistAngle = h * 2 + (Math.random() > 0.5 ? 0 : Math.PI);
        shapes.twist.push(
            Math.cos(twistAngle) * twistRad,
            h,
            Math.sin(twistAngle) * twistRad
        );
    }
    return shapes;
};

// ==========================================
// 3. HOOK DE WEBCAM Y MEDIAPIPE
// ==========================================
const useHandTracking = () => {
    const videoRef = useRef(null);
    const handDataRef = useRef({ landmarks: null });
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let handLandmarker = null;
        let animationFrameId = null;

        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: VIDEO_WIDTH,
                        height: VIDEO_HEIGHT,
                        facingMode: "user"
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        setupMediaPipe();
                    };
                }
            } catch (err) {
                console.error("Error webcam:", err);
                setError("Cámara no disponible");
            }
        };

        const setupMediaPipe = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });

                setIsReady(true);
                predictLoop();
            } catch (err) {
                console.error("Error MediaPipe:", err);
                setError("Error cargando IA");
            }
        };

        const predictLoop = () => {
            if (videoRef.current && handLandmarker) {
                if (videoRef.current.videoWidth > 0 && videoRef.current.readyState >= 2) {
                    const results = handLandmarker.detectForVideo(videoRef.current, performance.now());
                    if (results.landmarks && results.landmarks.length > 0) {
                        handDataRef.current.landmarks = results.landmarks;
                    } else {
                        handDataRef.current.landmarks = null;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(predictLoop);
        };

        setupCamera();

        return () => {
            if (handLandmarker) handLandmarker.close();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return { videoRef, handDataRef, isReady, error };
};

// ==========================================
// 4. ESCENA THREE.JS PURA CON ESQUELETO
// ==========================================
const ThreeScene = ({ currentShape, handDataRef, showSkeleton }) => {
    const mountRef = useRef(null);
    const shapesRef = useRef(generateShapes(PARTICLE_COUNT));

    useEffect(() => {
        if (!mountRef.current) return;

        // --- 1. SETUP ESCENA ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#050505');
        scene.fog = new THREE.Fog('#050505', 10, 25);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 12;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = 0.5;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        // --- 2. SISTEMA DE PARTÍCULAS ---
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
            velocities[i] = 0;
            colors[i] = 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particlesMesh = new THREE.Points(geometry, material);
        scene.add(particlesMesh);

        // --- 3. SISTEMA DE ESQUELETO (MANO) ---
        const skeletonGroup = new THREE.Group();
        skeletonGroup.visible = false;
        scene.add(skeletonGroup);

        // A. Articulaciones (Joints)
        const jointGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const jointMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, depthTest: false });
        const joints = [];
        for (let i = 0; i < 21; i++) {
            const mesh = new THREE.Mesh(jointGeo, jointMat);
            mesh.renderOrder = 1; // Dibujar encima de partículas
            skeletonGroup.add(mesh);
            joints.push(mesh);
        }

        // B. Huesos (Bones)
        const boneMat = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.6 });
        const bones = [];
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8], // Índice
            [0, 9], [9, 10], [10, 11], [11, 12], // Medio
            [0, 13], [13, 14], [14, 15], [15, 16], // Anular
            [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
            [5, 9], [9, 13], [13, 17], [0, 17] // Palma
        ];

        connections.forEach(pair => {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            const line = new THREE.Line(geo, boneMat);
            line.renderOrder = 1;
            skeletonGroup.add(line);
            bones.push({ line, pair });
        });

        // --- 4. LOOP DE ANIMACIÓN ---
        let animationId;

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            // A. Lógica de Cámara y Visualización
            const hasHand = handDataRef.current && handDataRef.current.landmarks;
            controls.autoRotate = !hasHand;
            controls.update();

            // Control de visibilidad del esqueleto (prop + detección)
            const showSkel = window.showSkeletonRef ? window.showSkeletonRef.current : true;
            skeletonGroup.visible = !!(hasHand && showSkel);

            // B. Variables de interacción
            let handX = 10000;
            let handY = 10000;
            let isPinching = false;

            // C. Actualizar Esqueleto
            if (hasHand) {
                const landmarks = handDataRef.current.landmarks[0];

                // 1. Mapeo y actualización de articulaciones
                landmarks.forEach((lm, i) => {
                    const x = (1 - lm.x - 0.5) * 20;
                    const y = (1 - lm.y - 0.5) * 15;
                    const z = -lm.z * 10;
                    joints[i].position.set(x, y, z);
                });

                // 2. Actualización de líneas (Huesos)
                bones.forEach(bone => {
                    const idx1 = bone.pair[0];
                    const idx2 = bone.pair[1];
                    const p1 = joints[idx1].position;
                    const p2 = joints[idx2].position;
                    const posAttr = bone.line.geometry.attributes.position;

                    posAttr.setXYZ(0, p1.x, p1.y, p1.z);
                    posAttr.setXYZ(1, p2.x, p2.y, p2.z);
                    posAttr.needsUpdate = true;
                });

                // 3. Extraer datos para interacción (Punta del índice)
                const indexTip = landmarks[8];
                const thumbTip = landmarks[4];

                handX = (1 - indexTip.x - 0.5) * 20;
                handY = (1 - indexTip.y - 0.5) * 15;

                const dx = indexTip.x - thumbTip.x;
                const dy = indexTip.y - thumbTip.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                isPinching = dist < 0.05;
            }

            // D. Lógica de Partículas
            const shapeName = window.currentShapeRef ? window.currentShapeRef.current : 'sphere';
            const targetArr = shapesRef.current[shapeName];
            const posAttribute = geometry.attributes.position;
            const colAttribute = geometry.attributes.color;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const idx = i * 3;
                const px = posAttribute.array[idx];
                const py = posAttribute.array[idx + 1];
                const pz = posAttribute.array[idx + 2];
                const tx = targetArr[idx];
                const ty = targetArr[idx + 1];
                const tz = targetArr[idx + 2];

                // Fuerza Home
                let ax = (tx - px) * 0.02;
                let ay = (ty - py) * 0.02;
                let az = (tz - pz) * 0.02;

                // Fuerza Mano
                const dx = px - handX;
                const dy = py - handY;
                const dz = pz - 0;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < INTERACTION_RADIUS * INTERACTION_RADIUS) {
                    const force = (1 - Math.sqrt(distSq) / INTERACTION_RADIUS);
                    if (isPinching) {
                        ax -= dx * force * 0.15;
                        ay -= dy * force * 0.15;
                        az -= dz * force * 0.15;
                    } else {
                        ax += dx * force * 0.08 + (Math.random() - 0.5) * 0.1;
                        ay += dy * force * 0.08 + (Math.random() - 0.5) * 0.1;
                        az += dz * force * 0.08;
                    }
                }

                velocities[idx] = (velocities[idx] + ax) * 0.92;
                velocities[idx + 1] = (velocities[idx + 1] + ay) * 0.92;
                velocities[idx + 2] = (velocities[idx + 2] + az) * 0.92;

                posAttribute.array[idx] += velocities[idx];
                posAttribute.array[idx + 1] += velocities[idx + 1];
                posAttribute.array[idx + 2] += velocities[idx + 2];

                const speed = Math.abs(velocities[idx]) + Math.abs(velocities[idx + 1]);
                colAttribute.array[idx] = 0.2 + speed * 2.0;
                colAttribute.array[idx + 1] = 0.5 + speed * 0.5;
                colAttribute.array[idx + 2] = 1.0;
            }

            posAttribute.needsUpdate = true;
            colAttribute.needsUpdate = true;
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            mountRef.current?.removeChild(renderer.domElement);
            geometry.dispose();
            material.dispose();
        };
    }, []);

    const shapeRef = useRef(currentShape);
    const showSkeletonRef = useRef(showSkeleton);

    useEffect(() => {
        shapeRef.current = currentShape;
        window.currentShapeRef = shapeRef;
    }, [currentShape]);

    useEffect(() => {
        showSkeletonRef.current = showSkeleton;
        window.showSkeletonRef = showSkeletonRef;
    }, [showSkeleton]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

// ==========================================
// 5. COMPONENTE PRINCIPAL
// ==========================================
export default function ParticleMorph() {
    const [currentShape, setCurrentShape] = useState('sphere');
    const [showSkeleton, setShowSkeleton] = useState(true);
    const { videoRef, handDataRef, isReady, error } = useHandTracking();

    const shapes = [
        { id: 'sphere', icon: CircleDashed, label: 'Esfera' },
        { id: 'heart', icon: Heart, label: 'Corazón' },
        { id: 'saturn', icon: Hexagon, label: 'Saturno' },
        { id: 'twist', icon: Zap, label: 'ADN' },
        { id: 'cube', icon: Maximize2, label: 'Cubo' },
    ];

    return (
        <div className="pm-container">
            <style>{`
        .pm-container {
          width: 100%;
          height: 100vh;
          background: black;
          color: white;
          position: relative;
          overflow: hidden;
          font-family: sans-serif;
        }
        .pm-container * { box-sizing: border-box; }
        .pm-hud-header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          padding: 24px;
          pointer-events: none;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          z-index: 10;
        }
        .pm-title {
          font-size: 30px;
          font-weight: bold;
          letter-spacing: -0.05em;
          background: linear-gradient(to right, #22d3ee, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .pm-status-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .pm-hud-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .pm-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s;
        }
        .pm-badge-ready {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #4ade80;
        }
        .pm-badge-loading {
          background: rgba(234, 179, yellow, 0.1);
          border-color: rgba(234, 179, 8, 0.3);
          color: #facc15;
        }
        .pm-indicator {
          position: relative;
          display: flex;
          height: 8px;
          width: 8px;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .pm-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          position: absolute;
          height: 100%;
          width: 100%;
          border-radius: 9999px;
          background: #4ade80;
          opacity: 0.75;
        }
        .pm-dot {
          position: relative;
          border-radius: 9999px;
          height: 8px;
          width: 8px;
          background: #22c55e;
        }
        .pm-badge-text {
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 0.025em;
        }
        .pm-toggle-btn {
          pointer-events: auto;
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
        }
        .pm-toggle-btn.active {
          background: rgba(6, 182, 212, 0.2);
          border-color: rgba(6, 182, 212, 0.5);
          color: #cffafe;
        }
        .pm-control-bar {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: auto;
          box-shadow: 0 25px 50px -12px rgba(88, 28, 135, 0.2);
          z-index: 10;
        }
        .pm-shape-btn {
          position: relative;
          padding: 12px;
          border-radius: 12px;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 70px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }
        .pm-shape-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .pm-shape-btn.active {
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.2), rgba(37, 99, 235, 0.2));
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
          color: #22d3ee;
        }
        .pm-icon {
          width: 24px;
          height: 24px;
          transition: transform 0.3s;
        }
        .pm-shape-btn.active .pm-icon {
          transform: scale(1.1);
        }
        .pm-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: inherit;
        }
        .pm-indicator-dot {
          position: absolute;
          bottom: -4px;
          width: 4px;
          height: 4px;
          border-radius: 9999px;
          background: #22d3ee;
          box-shadow: 0 0 5px #22d3ee;
        }
        .pm-loading-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 50;
        }
        .pm-loading-card {
          background: rgba(0, 0, 0, 0.8);
          padding: 16px 32px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pm-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

            <video
                ref={videoRef}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                playsInline
                muted
                autoPlay
            />

            <ThreeScene
                currentShape={currentShape}
                handDataRef={handDataRef}
                showSkeleton={showSkeleton}
            />

            <div className="pm-hud-header">
                <div>
                    <h1 className="pm-title">Particle Morph</h1>
                    <p className="pm-status-text">
                        <Fingerprint size={16} />
                        {error ? <span style={{ color: '#f87171' }}>{error}</span> : (isReady ? 'Rastreo Activo' : 'Cargando...')}
                    </p>
                </div>

                <div className="pm-hud-right">
                    <div className={`pm-badge ${isReady ? 'pm-badge-ready' : 'pm-badge-loading'}`}>
                        {isReady ? (
                            <>
                                <div className="pm-indicator">
                                    <span className="pm-ping"></span>
                                    <span className="pm-dot"></span>
                                </div>
                                <span className="pm-badge-text">AI READY</span>
                            </>
                        ) : (
                            <>
                                <Loader2 size={12} className="pm-spin" />
                                <span className="pm-badge-text">
                                    {error ? 'ERROR' : 'CARGANDO IA...'}
                                </span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowSkeleton(!showSkeleton)}
                        className={`pm-toggle-btn ${showSkeleton ? 'active' : ''}`}
                    >
                        <Bone size={12} />
                        {showSkeleton ? 'Ocultar Huesos' : 'Ver Huesos'}
                    </button>
                </div>
            </div>

            <div className="pm-control-bar">
                {shapes.map((shape) => {
                    const Icon = shape.icon;
                    const isActive = currentShape === shape.id;
                    return (
                        <button
                            key={shape.id}
                            onClick={() => setCurrentShape(shape.id)}
                            className={`pm-shape-btn ${isActive ? 'active' : ''}`}
                        >
                            <Icon className="pm-icon" />
                            <span className="pm-label">
                                {shape.label}
                            </span>
                            {isActive && <div className="pm-indicator-dot" />}
                        </button>
                    )
                })}
            </div>

            {!isReady && !error && (
                <div className="pm-loading-overlay">
                    <div className="pm-loading-card">
                        <Loader2 size={40} style={{ color: '#22d3ee' }} className="pm-spin" />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Iniciando Motor IA...</p>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Por favor permite el acceso a la cámara</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
