
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    title: string;
    children?: ReactNode;
    titleClassName?: string;
}

export function Header({ title, children, titleClassName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <h1 className={cn("text-lg font-semibold md:text-2xl font-headline", titleClassName)}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  );
}
