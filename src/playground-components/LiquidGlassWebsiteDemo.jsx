import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import LiquidGlassShader from '../components/effects/LiquidGlassShader';
import {
    ShoppingBag, Search, Menu, ArrowRight, Cpu, Zap, Layers, Smartphone, Globe, ImageIcon, Info
} from 'lucide-react';

// --- LiquidButton: Registers its position with the global shader ---
const LiquidButton = ({ children, onRegister, style = {}, ...props }) => {
    const ref = useRef(null);

    useLayoutEffect(() => {
        const update = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                // Normalize coordinates for shader (0-1), WebGL Y is inverted
                onRegister({
                    x: (rect.left + rect.width / 2) / window.innerWidth,
                    y: 1.0 - (rect.top + rect.height / 2) / window.innerHeight,
                    w: (rect.width / 2) / window.innerWidth,
                    h: (rect.height / 2) / window.innerHeight
                });
            }
        };
        update();
        window.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [onRegister]);

    return (
        <button ref={ref} style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            ...style
        }} {...props}>
            {children}
        </button>
    );
};

const LiquidGlassWebsiteDemo = () => {
    const [panels, setPanels] = useState([]);
    const panelsRef = useRef({});

    // Function to aggregate registered panels
    const registerPanel = (id, data) => {
        panelsRef.current[id] = data;
        const newPanels = Object.values(panelsRef.current);
        // Batch updates briefly to avoid thrashing
        setPanels(newPanels);
    };

    // Mobile menu state (kept for potential future use, though not used in new nav)
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0); // Kept for potential future use

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- Background Component (CSS Mesh Gradient only for texture) ---
    // This component is now just for the static background color and blobs,
    // the dynamic liquid effect is handled by LiquidGlassShader.
    const MeshTexture = () => (
        <div id="mesh-gradient" style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(125deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            overflow: 'hidden', position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: '10%', left: '20%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>
    );

    // --- Styles ---
    const sectionStyle = {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        color: 'white'
    };

    const navLinkStyle = {
        color: 'rgba(255,255,255,0.8)',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'color 0.2s',
        cursor: 'pointer'
    };

    return (
        <div style={{
            minHeight: '200vh',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: '#000',
            position: 'relative'
        }}>

            {/* GLOBAL SHADER LAYER */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <LiquidGlassShader
                    panels={panels}
                    performanceMode={false}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* --- Main Contents --- */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Navigation Bar */}
                <nav style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1100px', display: 'flex', justifyContent: 'center' }}>
                    {/* Nav acts as a single large liquid panel */}
                    <div style={{ width: '100%', height: '64px', position: 'relative' }}>
                        <LiquidButton
                            onRegister={(d) => registerPanel('nav', d)}
                            style={{ width: '100%', height: '100%', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 24px', alignItems: 'center', color: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={20} fill="white" /> <span style={{ fontWeight: 'bold' }}>LiquidOS</span>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', opacity: 0.7, display: 'none', '@media (min-width: 768px)': { display: 'flex' } }}>
                                    <a style={navLinkStyle}>Vision</a>
                                    <a style={navLinkStyle}>Specs</a>
                                    <a style={navLinkStyle}>Design</a>
                                    <a style={navLinkStyle}>Buy</a>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Search size={20} color="white" style={{ opacity: 0.8, cursor: 'pointer' }} />
                                    <ShoppingBag size={20} color="white" style={{ opacity: 0.8, cursor: 'pointer' }} />
                                    <Menu size={24} color="white" style={{ cursor: 'pointer' }} onClick={() => setIsMenuOpen(!isMenuOpen)} />
                                </div>
                            </div>
                        </LiquidButton>
                    </div>
                </nav>

                {/* Hero Section */}
                <section style={{ ...sectionStyle, paddingTop: '180px' }}>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        fontWeight: '800',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to bottom, #ffffff, #888888)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Liquid Glass
                    </h1>
                    <p style={{
                        fontSize: '1.5rem',
                        color: 'rgba(255,255,255,0.6)',
                        maxWidth: '600px',
                        marginTop: '20px',
                        fontWeight: '400'
                    }}>
                        The next evolution of interface materials. Light, depth, and fluid motion combined.
                    </p>

                    <div style={{ marginTop: '48px', display: 'flex', gap: '16px' }}>
                        {/* Button 1 */}
                        <LiquidButton
                            onRegister={(d) => registerPanel('hero-btn-1', d)}
                            style={{ padding: '16px 32px', borderRadius: '32px', color: 'black', fontWeight: 600, background: 'white' }}
                        >
                            Explore Vision Pro <ArrowRight size={20} />
                        </LiquidButton>
                        {/* Button 2 */}
                        <LiquidButton
                            onRegister={(d) => registerPanel('hero-btn-2', d)}
                            style={{ padding: '16px 32px', borderRadius: '32px', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            Learn More
                        </LiquidButton>
                    </div>
                </section>

                {/* Features / Cards */}
                <section style={sectionStyle}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px',
                        width: '100%',
                        marginTop: '40px'
                    }}>
                        {[
                            { icon: <Cpu />, title: "M4 Powered", desc: "Built for the most demanding neural tasks." },
                            { icon: <Layers />, title: "3D Depth", desc: "Interface elements that feel real to touch." },
                            { icon: <Smartphone />, title: "Mobile Optimized", desc: "Liquid rendering at 120Hz." }
                        ].map((item, i) => (
                            <div key={i} style={{ height: '320px', position: 'relative' }}>
                                <LiquidButton
                                    onRegister={(d) => registerPanel(`card-${i}`, d)}
                                    style={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'flex-start', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '24px',
                                        color: 'white'
                                    }}>
                                        {item.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', margin: '0 0 12px 0', color: 'white' }}>{item.title}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', fontSize: '1.1rem', textAlign: 'left' }}>{item.desc}</p>
                                </LiquidButton>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Showcase: Gooey Effect - This section is removed as LiquidGlassContainerView is no longer used */}
                {/* <section style={{ ...sectionStyle, paddingBottom: '200px' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>Merging UI Elements</h2>
                    <LiquidGlassContainerView spacing={40}>
                        <LiquidGlassView style={{ width: 120, height: 120, borderRadius: '50%' }}>
                            <Zap />
                        </LiquidGlassView>
                        <LiquidGlassView style={{ width: 150, height: 150, borderRadius: '50%' }}>
                            <Layers />
                        </LiquidGlassView>
                        <LiquidGlassView style={{ width: 120, height: 120, borderRadius: '50%' }}>
                            <Cpu />
                        </LiquidGlassView>
                    </LiquidGlassContainerView>
                    <p style={{ marginTop: '40px', color: 'rgba(255,255,255,0.4)' }}>
                        Our proprietary Liquid Glass technology allows UI elements to flow and merge seamlessly.
                    </p>
                </section> */}

                {/* Dock at bottom */}
                <div style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '12px',
                    padding: '0 20px',
                    borderRadius: '40px',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    {[Globe, ImageIcon, Smartphone, Info].map((Icon, i) => (
                        <LiquidButton
                            key={i}
                            onRegister={(d) => registerPanel(`dock-${i}`, d)}
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: i === 0 ? 'rgba(0, 122, 255, 0.4)' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: i === 0 ? '1px solid rgba(0, 122, 255, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                transition: 'transform 0.2s',
                                // Hover effect (Note: inline style pseudo-classes are not standard React, usually done with state or CSS modules)
                                // For this example, we'll keep it as is, but be aware of this limitation.
                                // ':hover': { transform: 'scale(1.1)' }
                            }}
                        >
                            <Icon size={24} />
                        </LiquidButton>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default LiquidGlassWebsiteDemo;
