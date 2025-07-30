
'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

const publicRoutes = ['/signin', '/quote/'];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (loading) {
      return;
    }
    
    // If the user is not logged in and trying to access a private route, redirect to signin.
    if (!user && !isPublic) {
      router.push('/signin');
    }
  }, [user, loading, router, isPublic, pathname]);

  // While loading, or if we're about to redirect a non-authed user, show a spinner.
  if (loading || (!user && !isPublic)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If the route is public (e.g., /signin or /quote/[id]), render the page directly.
  // The page itself will handle redirecting away if the user is already logged in on /signin.
  if (isPublic) {
    return <>{children}</>;
  }

  // If we're on a private route and the user is logged in, render the app shell.
  return (
    <div className="flex min-h-screen w-full">
      <SidebarProvider>
        <AppSidebar />
        {children}
      </SidebarProvider>
    </div>
  );
}
