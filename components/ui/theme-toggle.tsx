'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    if (!mounted) {
        // Render a placeholder with the same dimensions to avoid layout shift
        return (
            <div className="h-9 w-9 rounded-full" />
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            id="theme-toggle"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
                'relative h-9 w-9 rounded-full',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent',
                'transition-colors duration-300'
            )}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Sun icon — visible in dark mode */}
            <Sun
                className={cn(
                    'absolute h-[1.2rem] w-[1.2rem] transition-all duration-300',
                    isDark
                        ? 'rotate-0 scale-100 opacity-100'
                        : '-rotate-90 scale-0 opacity-0'
                )}
            />
            {/* Moon icon — visible in light mode */}
            <Moon
                className={cn(
                    'absolute h-[1.2rem] w-[1.2rem] transition-all duration-300',
                    isDark
                        ? 'rotate-90 scale-0 opacity-0'
                        : 'rotate-0 scale-100 opacity-100'
                )}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
