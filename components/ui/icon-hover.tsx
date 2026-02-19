'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface IconHoverProps {
    children: React.ReactNode;
    className?: string;
}

export function IconHover({ children, className }: IconHoverProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <span
            className={cn(
                'inline-flex transition-transform duration-200',
                isHovered && 'animate-icon-bounce',
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onAnimationEnd={() => setIsHovered(false)}
        >
            {children}
        </span>
    );
}
