'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  LogOut,
  Menu,
  X,
  UserCog,
  Home,
  ClipboardList,
  Settings,
  DollarSign,
  Activity,
  Briefcase,
  User,
  Bell,
  Play
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { clearSession, sessionManager } from '@/lib/session';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type UserRole = 'super_admin' | 'agency' | 'owner' | 'manager' | 'tenant' | 'maintenance' | 'agent';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Navigation items based on role (Profile removed from desktop - now in top navbar)
const getNavigationByRole = (role: UserRole | null): NavItem[] => {
  switch (role) {
    case 'super_admin':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Demo Requests', href: '/dashboard/admin/demo-requests', icon: Play },
        { name: 'Users', href: '/dashboard/admin/users', icon: Users },
        { name: 'Agencies', href: '/dashboard/admin/agencies', icon: UserCog },
        { name: 'Properties', href: '/dashboard/admin/properties', icon: Building2 },
        { name: 'Agents', href: '/dashboard/admin/agents', icon: Briefcase },
        { name: 'Commissions', href: '/dashboard/admin/commissions', icon: DollarSign },
        { name: 'Reports', href: '/dashboard/admin/reports', icon: ClipboardList },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
      ];
    case 'agency':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
        { name: 'Owners', href: '/dashboard/agency/owners', icon: Users },
        { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench },
        { name: 'Reports', href: '/dashboard/agency/reports', icon: ClipboardList },
      ];
    case 'owner':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
        { name: 'Tenants', href: '/dashboard/tenants', icon: Users },
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
        { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench },
      ];
    case 'tenant':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Unit', href: '/dashboard/tenant/unit', icon: Home },
        { name: 'Payments', href: '/dashboard/tenant/payments', icon: CreditCard },
        { name: 'Maintenance', href: '/dashboard/tenant/maintenance', icon: Wrench },
      ];
    case 'manager':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Properties', href: '/dashboard/manager/properties', icon: Building2 },
        { name: 'Tenants', href: '/dashboard/manager/tenants', icon: Users },
        { name: 'Payments', href: '/dashboard/manager/payments', icon: CreditCard },
        { name: 'Maintenance', href: '/dashboard/manager/maintenance', icon: Wrench },
      ];
    case 'maintenance':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Tickets', href: '/dashboard/staff/tickets', icon: ClipboardList },
      ];
    case 'agent':
      return [
        { name: 'Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
        { name: 'Assist Owners', href: '/dashboard/agent/assist-owner', icon: Building2 },
        { name: 'Assist Tenants', href: '/dashboard/agent/assist-tenant', icon: Users },
        { name: 'Transactions', href: '/dashboard/agent/transactions', icon: Activity },
        { name: 'Earnings', href: '/dashboard/agent/earnings', icon: DollarSign },
      ];
    default:
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ];
  }
};

// Get profile URL based on role (for mobile menu)
const getProfileUrl = (role: UserRole | null): string => {
  switch (role) {
    case 'super_admin': return '/dashboard/admin/profile';
    case 'agency': return '/dashboard/agency/profile';
    case 'owner': return '/dashboard/owner/profile';
    case 'manager': return '/dashboard/manager/profile';
    case 'tenant': return '/dashboard/tenant/profile';
    case 'maintenance': return '/dashboard/staff/profile';
    case 'agent': return '/dashboard/agent/profile';
    default: return '/dashboard';
  }
};

// Role display names
const getRoleDisplayName = (role: UserRole | null): string => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'agency': return 'Agency';
    case 'owner': return 'Owner';
    case 'manager': return 'Property Manager';
    case 'tenant': return 'Tenant';
    case 'maintenance': return 'Maintenance Staff';
    case 'agent': return 'Agent';
    default: return 'User';
  }
};

// Role badge colors
const getRoleBadgeClass = (role: UserRole | null): string => {
  switch (role) {
    case 'super_admin': return 'bg-red-500/20 text-red-200';
    case 'agency': return 'bg-purple-500/20 text-purple-200';
    case 'owner': return 'bg-blue-500/20 text-blue-200';
    case 'manager': return 'bg-cyan-500/20 text-cyan-200';
    case 'tenant': return 'bg-green-500/20 text-green-200';
    case 'maintenance': return 'bg-orange-500/20 text-orange-200';
    case 'agent': return 'bg-amber-500/20 text-amber-200';
    default: return 'bg-gray-500/20 text-gray-200';
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const role = sessionManager.getUserRole() as UserRole | null;
    const user = sessionManager.getUser();
    setUserRole(role);
    if (user) {
      setUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email);
    }
  }, []);

  const navigation = getNavigationByRole(userRole);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          <span className="text-lg font-bold text-primary">R</span>
        </div>
        <h1 className="text-2xl font-bold text-sidebar-foreground">Renta</h1>
      </div>

      {/* User info with role badge */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
        <span className={cn(
          'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
          getRoleBadgeClass(userRole)
        )}>
          {getRoleDisplayName(userRole)}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between bg-sidebar px-4 lg:hidden">
        <h1 className="text-xl font-bold text-sidebar-foreground">Renta</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-40 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* User info with role badge - mobile */}
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <span className={cn(
              'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
              getRoleBadgeClass(userRole)
            )}>
              {getRoleDisplayName(userRole)}
            </span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4 space-y-1">
            {/* Mobile-only: Language Switcher */}
            <div className="px-3 py-2.5">
              <LanguageSwitcher />
            </div>
            {/* Mobile-only: Notifications link */}
            <Link
              href="/dashboard/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Bell className="h-5 w-5" />
              Notifications
            </Link>
            {/* Mobile-only: Profile link */}
            <Link
              href={getProfileUrl(userRole)}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <User className="h-5 w-5" />
              Profile
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col bg-sidebar">
        <SidebarContent />
      </aside>
    </>
  );
}
