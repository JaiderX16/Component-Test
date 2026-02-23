
import React from 'react';

// Check for backdrop-filter support
export const isLiquidGlassSupported = typeof window !== 'undefined' && (CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)'));

/**
 * LiquidGlassView component
 * Renders a glass-morphism style view.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to display inside the glass view
 * @param {object} props.style - Additional styles for the container
 * @param {boolean} props.interactive - If true, adds hover/active effects
 * @param {'clear' | 'regular'} props.effect - Glass effect type ('regular' is standard frosted, 'clear' is more transparent)
 * @param {string} props.tintColor - Color overlay for the glass
 * @param {'light' | 'dark' | 'system'} props.colorScheme - Light or dark mode for the glass effect
 */
export const LiquidGlassView = ({
    children,
    style = {},
    interactive = false,
    effect = 'regular',
    tintColor,
    colorScheme = 'system',
    ...props
}) => {
    // Determine base styles based on effect type
    const isClear = effect === 'clear';

    // Determine background color based on scheme and tint
    let bgColor;
    if (tintColor) {
        bgColor = tintColor;
    } else if (colorScheme === 'dark') {
        bgColor = isClear ? 'rgba(20, 20, 20, 0.3)' : 'rgba(30, 30, 30, 0.5)';
    } else {
        bgColor = isClear ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.45)';
    }

    // Base style for the glass effect
    const baseStyle = {
        position: 'relative',
        backdropFilter: `blur(${effect === 'clear' ? '12px' : '24px'}) saturate(180%)`,
        WebkitBackdropFilter: `blur(${effect === 'clear' ? '12px' : '24px'}) saturate(180%)`,
        backgroundColor: bgColor,
        // Thick glass border
        border: '1px solid rgba(255, 255, 255, 0.2)',
        // Specular highlight and deep shadow for liquid feel
        boxShadow: `
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.4)
        `,
        borderRadius: style.borderRadius || '20px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colorScheme === 'dark' ? 'white' : 'inherit',
        ...style
    };

    return (
        <div
            style={baseStyle}
            className={`liquid-glass-view ${interactive ? 'interactive' : ''}`}
            {...props}
        >
            {children}
            {interactive && <style>{`
                .liquid-glass-view.interactive:hover {
                    transform: translateY(-4px) scale(1.01);
                    box-shadow: 0 16px 48px 0 rgba(31, 38, 135, 0.25) !important;
                    border-color: rgba(255, 255, 255, 0.6) !important;
                }
                .liquid-glass-view.interactive:active {
                    transform: scale(0.96);
                }
            `}</style>}
        </div>
    );
};

/**
 * LiquidGlassContainerView component
 * Groups LiquidGlassView components and applies a "gooey" merging effect.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Children to render
 * @param {object} props.style - Container styles
 * @param {number} props.spacing - Spacing between elements
 */
export const LiquidGlassContainerView = ({
    children,
    style = {},
    spacing = 0,
    ...props
}) => {
    return (
        <div style={{ position: 'relative', ...style }} {...props}>
            {/* SVG Filter for the Gooey Effect - hidden but referenced */}
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                            result="goo"
                        />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <div style={{
                filter: 'url(#goo)',
                padding: '40px', // Extra padding for blur spill
                display: 'flex',
                gap: spacing,
                flexWrap: 'wrap',
                justifyContent: 'center',
                // Using transform: translateZ(0) can sometimes help with rendering artifacts
                transform: 'translateZ(0)'
            }}>
                {children}
            </div>
        </div>
    );
};
