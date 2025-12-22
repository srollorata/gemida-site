'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navigation from '@/components/ui/navigation';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/login';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {user && !isLoginPage && <Navigation />}
      <main className={user && !isLoginPage ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>FamilyTree - Connect with your family heritage</title>
        <meta name="description" content="A beautiful family site to connect, share memories, and explore your family tree" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AppContent>{children}</AppContent>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}