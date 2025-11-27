'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import Sidebar from '@/components/dashboard/Sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
