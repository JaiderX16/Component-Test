import React, { useState } from 'react';
import GlassContainer from './GlassContainer';

const GlassContainerDemo = () => {
    const [darkMode, setDarkMode] = useState(true);

    const darkBg = `
    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(120, 80, 255, 0.5) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 30% 60%, rgba(255, 100, 150, 0.4) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 70% 30%, rgba(0, 180, 255, 0.4) 0%, transparent 60%),
    linear-gradient(to bottom, #1a0533, #0a1628, #0d0d1a)
  `;
    const lightBg = `
    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(180, 140, 255, 0.35) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 30% 60%, rgba(255, 160, 200, 0.3) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 70% 30%, rgba(100, 200, 255, 0.3) 0%, transparent 60%),
    linear-gradient(to bottom, #f0e6ff, #e0ecf8, #eef0f5)
  `;

    return (
        <div style={{
            minHeight: '100vh',
            background: darkMode ? darkBg : lightBg,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            position: 'relative',
            transition: 'background 0.5s ease',
        }}>

            {/* ── Toggle modo ── */}
            <button
                onClick={() => setDarkMode(d => !d)}
                style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 100,
                    padding: '8px 20px', borderRadius: 24,
                    background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    color: darkMode ? '#fff' : '#333',
                    cursor: 'pointer', backdropFilter: 'blur(12px)',
                    fontWeight: 600, fontSize: 13,
                    transition: 'all 0.4s ease',
                }}
            >
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
            </button>

            {/* ── Título ── */}
            <h1 style={{
                color: darkMode ? '#fff' : '#1e1b4b',
                fontSize: 38, fontWeight: 700, margin: '1.5rem 0 0',
                letterSpacing: '-0.6px', textAlign: 'center',
                transition: 'color 0.4s ease',
            }}>
                Glass Container
            </h1>
            <p style={{
                color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(30,27,75,0.5)',
                fontSize: 15, marginTop: -6, textAlign: 'center',
                transition: 'color 0.4s ease',
            }}>
                Componente reutilizable con efecto vidrio esmerilado
            </p>

            {/* ══════════════════════════════════════
          1. Tarjeta de perfil (default)
         ══════════════════════════════════════ */}
            <GlassContainer isDarkMode={darkMode}>
                <img
                    src="https://i.pravatar.cc/56?img=12"
                    alt="avatar"
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Ana García</div>
                    <div style={{ opacity: 0.6, fontSize: 13, fontWeight: 400 }}>Diseñadora UX · En línea</div>
                </div>
            </GlassContainer>

            {/* ══════════════════════════════════════
          2. Chips (rounded)
         ══════════════════════════════════════ */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['🎨 Diseño', '⚡ Rendimiento', '🔒 Seguridad', '🌍 Global'].map(label => (
                    <GlassContainer key={label} variant="rounded" isDarkMode={darkMode} glassOpacity={darkMode ? 0.18 : 0.55}>
                        <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{label}</span>
                    </GlassContainer>
                ))}
            </div>

            {/* ══════════════════════════════════════
          3. Notificación (medium)
         ══════════════════════════════════════ */}
            <GlassContainer variant="medium" isDarkMode={darkMode}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: darkMode
                            ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                            : 'linear-gradient(135deg, #818cf8, #c084fc)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 20,
                    }}>
                        🔔
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Nueva actualización</div>
                        <div style={{ opacity: 0.6, fontSize: 13, fontWeight: 400, lineHeight: 1.45 }}>
                            La versión 3.2 incluye mejoras de rendimiento y nuevas animaciones de vidrio líquido.
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <button style={{
                                padding: '6px 16px', borderRadius: 20, border: 'none',
                                background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                                color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                            }}>
                                Actualizar
                            </button>
                            <button style={{
                                padding: '6px 16px', borderRadius: 20,
                                border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                                background: 'transparent', color: 'inherit',
                                cursor: 'pointer', fontWeight: 500, fontSize: 12,
                            }}>
                                Después
                            </button>
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* ══════════════════════════════════════
          4. Estadísticas (large)
         ══════════════════════════════════════ */}
            <GlassContainer variant="large" isDarkMode={darkMode} glassOpacity={darkMode ? 0.15 : 0.5}>
                <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>📊 Resumen Semanal</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
                        {[
                            { value: '12.4k', label: 'Visitas', icon: '👁️' },
                            { value: '847', label: 'Interacciones', icon: '💬' },
                            { value: '94%', label: 'Satisfacción', icon: '⭐' },
                        ].map(stat => (
                            <div key={stat.label}>
                                <div style={{ fontSize: 22, marginBottom: 2 }}>{stat.icon}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{stat.value}</div>
                                <div style={{ fontSize: 12, opacity: 0.5, fontWeight: 400, marginTop: 2 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassContainer>

            {/* ══════════════════════════════════════
          5. Reproductor de música
         ══════════════════════════════════════ */}
            <GlassContainer isDarkMode={darkMode} glassOpacity={darkMode ? 0.28 : 0.55}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 12,
                        background: 'linear-gradient(135deg, #f97316, #ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, flexShrink: 0,
                    }}>
                        🎵
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Blinding Lights</div>
                        <div style={{ opacity: 0.6, fontSize: 13, fontWeight: 400 }}>The Weeknd</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 22 }}>
                        <span style={{ cursor: 'pointer', opacity: 0.7 }}>⏮</span>
                        <span style={{
                            cursor: 'pointer', width: 40, height: 40, borderRadius: '50%',
                            background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>▶</span>
                        <span style={{ cursor: 'pointer', opacity: 0.7 }}>⏭</span>
                    </div>
                </div>
            </GlassContainer>

            {/* ══════════════════════════════════════
          6. Galería de imágenes (large)
         ══════════════════════════════════════ */}
            <GlassContainer variant="large" isDarkMode={darkMode} glassOpacity={darkMode ? 0.12 : 0.45}>
                <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🖼️ Galería</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {[
                            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=150&fit=crop',
                            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=150&fit=crop',
                            'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=200&h=150&fit=crop',
                        ].map((src, i) => (
                            <img key={i} src={src} alt=""
                                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8, display: 'block' }}
                            />
                        ))}
                    </div>
                </div>
            </GlassContainer>

            {/* Pie */}
            <p style={{
                color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(30,27,75,0.3)',
                fontSize: 12, marginTop: 16, letterSpacing: '0.5px',
                transition: 'color 0.4s ease',
            }}>
                GlassContainer · Vidrio esmerilado adaptable
            </p>
        </div>
    );
};

export default GlassContainerDemo;
