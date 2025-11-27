'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  return (
    <div className='min-h-screen'>
      {/* Navigation */}
      <nav className='bg-background border-b sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <Link href='/' className='flex items-center gap-2'>
              <span className='text-2xl font-bold text-primary'>Renta</span>
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center gap-6'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='text-muted-foreground hover:text-foreground font-medium transition-colors'
                >
                  {item.name}
                </Link>
              ))}
              {isLoggedIn ? (
                <Button asChild>
                  <Link href='/dashboard'>
                    <LayoutDashboard className='h-4 w-4 mr-2' />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href='/login'>Get Started</Link>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className='md:hidden py-4 space-y-2 border-t'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className='px-4 pt-4'>
                {isLoggedIn ? (
                  <Button asChild className='w-full'>
                    <Link href='/dashboard' onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className='h-4 w-4 mr-2' />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className='w-full'>
                    <Link href='/login' onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
