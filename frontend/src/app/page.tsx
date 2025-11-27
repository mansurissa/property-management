'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, CreditCard, Wrench, BarChart3, Bell, Briefcase } from 'lucide-react';
import { getSession } from '@/lib/session';

const features = [
  {
    icon: Building2,
    title: 'Property Management',
    description: 'Manage multiple properties and units from a single dashboard.'
  },
  {
    icon: Users,
    title: 'Tenant Tracking',
    description: 'Keep track of tenants, lease dates, and contact information.'
  },
  {
    icon: CreditCard,
    title: 'Payment Recording',
    description: 'Record rent payments via cash, MoMo, or bank transfer.'
  },
  {
    icon: Wrench,
    title: 'Maintenance Tickets',
    description: 'Track and manage maintenance requests from tenants.'
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    description: 'View occupancy rates, revenue, and key metrics at a glance.'
  },
  {
    icon: Bell,
    title: 'Payment Reminders',
    description: 'Send automated reminders to tenants before rent is due.'
  }
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              Renta
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Property Management
            <br />
            <span className="text-[#715A5A]">Made Simple</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Renta helps Rwandan landlords manage their properties, track tenants, collect rent, and handle maintenance - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">Start Managing Properties</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Manage Your Properties
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Become an Agent Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Become a Renta Agent</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Earn commissions by helping property owners and tenants with their property management needs.
                Apply to become an agent and start earning today.
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link href="/apply-agent">Apply as an Agent</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Simplify Your Property Management?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join landlords across Rwanda who are using Renta to manage their properties.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">Get Started for Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Renta. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
