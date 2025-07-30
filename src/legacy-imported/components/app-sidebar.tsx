
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Building,
  FileText,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  KanbanSquare,
  Library,
  Briefcase,
  Settings,
  BarChart,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-sidebar-border text-sidebar-foreground">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg">
            CP
          </div>
          <h1 className="font-light text-base font-headline tracking-tight text-sidebar-foreground">Clearpoint Technology + Design</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'}>
              <Link href="/">
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <KanbanSquare />
              Leads
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/quotes')}>
              <Link href="/quotes">
                <FileText />
                Quotes
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/customers')}>
              <Link href="/customers/verify">
                <Building />
                Customers
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={pathname.startsWith('/products')}>
              <Link href="/products">
                <Library />
                Product Library
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/projects')}>
              <Link href="/projects">
                <Briefcase />
                Projects
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/reporting')}>
              <Link href="/reporting">
                <BarChart />
                Reporting
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton disabled>
                    <Settings />
                    Settings
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        
        {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg mt-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>
                        <UserIcon />
                    </AvatarFallback>
                </Avatar>
                <div className="truncate">
                    <p className="text-sm font-semibold truncate">{user.displayName}</p>
                    <p className="text-xs text-sidebar-foreground/80 truncate">{user.email}</p>
                </div>
            </div>
        )}

         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              Sign Out
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
