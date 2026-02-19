'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navigation from '@/components/ui/navigation';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import AuthSessionHandler from '@/components/AuthSessionHandler';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user && !isLoginPage) {
    window.location.href = '/login';
    return null;
  }

  if (user && isLoginPage) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {user && !isLoginPage && <Navigation />}
      <main className={user && !isLoginPage ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AnimatedBackground />
      <AuthProvider>
        <AppContent>{children}</AppContent>
        <Toaster />
        <AuthSessionHandler />
      </AuthProvider>
    </ThemeProvider>
  );
}
