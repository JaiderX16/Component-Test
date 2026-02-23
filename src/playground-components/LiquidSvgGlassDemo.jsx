import React from 'react';
import { GlassEffect } from '@liquid-svg-glass/react';

const LiquidSvgGlassDemo = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            background: '#000',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif'
        }}>
            {/* Apple-style vibrant wallpaper background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(120, 80, 255, 0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 60% 50% at 30% 60%, rgba(255, 100, 150, 0.4) 0%, transparent 60%),
                    radial-gradient(ellipse 70% 50% at 70% 30%, rgba(0, 180, 255, 0.4) 0%, transparent 60%),
                    radial-gradient(ellipse 50% 40% at 60% 80%, rgba(255, 180, 50, 0.3) 0%, transparent 50%),
                    linear-gradient(to bottom, #1a0533 0%, #0a1628 50%, #0d0d1a 100%)
                `,
                zIndex: 0
            }} />

            {/* Top status bar - Apple style */}
            <div style={{
                width: '100%',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                fontWeight: '500',
                letterSpacing: '0.5px'
            }}>
                Liquid Glass
            </div>

            {/* Hero section */}
            <div style={{
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                marginTop: '40px',
                marginBottom: '40px'
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: '700',
                    margin: 0,
                    textAlign: 'center',
                    letterSpacing: '-0.5px'
                }}>
                    Liquid Glass
                </h1>
                <p style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '17px',
                    fontWeight: '400',
                    margin: 0,
                    textAlign: 'center'
                }}>
                    A new dimension of depth.
                </p>
            </div>

            {/* Main GlassEffect panel - Apple style frosted card */}
            <div style={{ zIndex: 2 }}>
                <GlassEffect
                    preset="dock"
                    width={520}
                    height={500}
                    radius={28}
                    border={0.2}
                    blur={40}
                    frost={0.04}
                    alpha={0.199}
                    lightness={50}
                    scale={-20}
                    displace={0.1}
                    r={0}
                    g={0}
                    b={0}
                    draggable
                />
            </div>

            <div style={{ height: '40px' }} />

            {/* Image gallery - Apple Photos grid style */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                width: '540px',
                zIndex: 1,
                padding: '0 20px'
            }}>
                {[
                    { src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&h=340&fit=crop', label: 'Ocean' },
                    { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&h=340&fit=crop', label: 'Mountains' },
                    { src: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=500&h=340&fit=crop', label: 'Aurora' },
                    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=340&fit=crop', label: 'Forest' },
                ].map((img, i) => (
                    <div key={i} style={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        aspectRatio: '4/3',
                        cursor: 'pointer',
                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <img
                            src={img.src}
                            alt={img.label}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '24px 14px 10px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            {img.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom text */}
            <p style={{
                marginTop: '48px',
                marginBottom: '40px',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
                letterSpacing: '0.5px',
                zIndex: 1
            }}>
                Powered by SVG displacement mapping
            </p>
        </div>
    );
};

export default LiquidSvgGlassDemo;
