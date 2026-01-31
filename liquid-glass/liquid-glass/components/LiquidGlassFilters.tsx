import React from 'react';

/**
 * Liquid Glass SVG Filters
 * 必须在应用根组件中引入，用于提供玻璃折射效果
 */
export const LiquidGlassFilters: React.FC = () => {
    return (
        <svg
            className="absolute w-0 h-0 overflow-hidden"
            aria-hidden="true"
        >
            <defs>
                {/* 主要玻璃折射效果 */}
                <filter
                    id="liquid-glass-distortion"
                    x="0%"
                    y="0%"
                    width="100%"
                    height="100%"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.008 0.008"
                        numOctaves="2"
                        seed="92"
                        result="noise"
                    />
                    <feGaussianBlur in="noise" stdDeviation="2" result="blur" />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="blur"
                        scale="77"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>

                {/* 按钮玻璃效果（轻微折射）*/}
                <filter
                    id="liquid-glass-button"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.008 0.008"
                        numOctaves="2"
                        seed="92"
                        result="noise"
                    />
                    <feGaussianBlur in="noise" stdDeviation="1.5" result="blur" />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="blur"
                        scale="50"
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="distorted"
                    />
                    <feGaussianBlur in="distorted" stdDeviation="0.5" result="finalBlur" />
                </filter>

                {/* 轻微折射（用于小组件）*/}
                <filter
                    id="liquid-glass-subtle"
                    x="0%"
                    y="0%"
                    width="100%"
                    height="100%"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.01 0.01"
                        numOctaves="1"
                        seed="42"
                        result="noise"
                    />
                    <feGaussianBlur in="noise" stdDeviation="1" result="blur" />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="blur"
                        scale="35"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </defs>
        </svg>
    );
};
