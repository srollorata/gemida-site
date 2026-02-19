'use client';

import React from 'react';

const PARTICLE_COUNT = 12;

// Deterministic positions/delays so there's no hydration mismatch
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: `${(i * 8.3) % 100}%`,
    width: `${3 + (i % 3) * 2}px`,
    height: `${3 + (i % 3) * 2}px`,
    animationDelay: `${(i * 1.7) % 20}s`,
    animationDuration: `${15 + (i % 6) * 3}s`,
}));

export function AnimatedBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            {/* Layer 1: Animated gradient */}
            <div className="absolute inset-0 bg-animated-gradient animate-gradient-shift" />

            {/* Layer 2: Grid shimmer */}
            <div className="absolute inset-0 bg-grid-pattern animate-grid-shimmer" />

            {/* Layer 3: Particle drift */}
            {particles.map((p, i) => (
                <span
                    key={i}
                    className="absolute bottom-0 rounded-full animate-particle-drift"
                    style={{
                        left: p.left,
                        width: p.width,
                        height: p.height,
                        backgroundColor: 'hsl(var(--particle-color) / 0.5)',
                        animationDelay: p.animationDelay,
                        animationDuration: p.animationDuration,
                    }}
                />
            ))}
        </div>
    );
}
