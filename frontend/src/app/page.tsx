'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  BarChart3,
  Bell,
  CheckCircle2,
  ArrowRight,
  Shield,
  Smartphone,
  Clock,
  Play
} from 'lucide-react';
import { getSession } from '@/lib/session';
import DemoRequestModal from '@/components/DemoRequestModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const features = [
    {
      icon: Building2,
      title: t('landing.propertyManagementTitle'),
      description: t('landing.propertyManagementDesc')
    },
    {
      icon: Users,
      title: t('landing.tenantTrackingTitle'),
      description: t('landing.tenantTrackingDesc')
    },
    {
      icon: CreditCard,
      title: t('landing.paymentRecordingTitle'),
      description: t('landing.paymentRecordingDesc')
    },
    {
      icon: Wrench,
      title: t('landing.maintenanceTicketsTitle'),
      description: t('landing.maintenanceTicketsDesc')
    },
    {
      icon: BarChart3,
      title: t('landing.dashboardAnalyticsTitle'),
      description: t('landing.dashboardAnalyticsDesc')
    },
    {
      icon: Bell,
      title: t('landing.paymentRemindersTitle'),
      description: t('landing.paymentRemindersDesc')
    }
  ];

  const benefits = [
    t('landing.freeToStart'),
    t('landing.noCreditCard'),
    t('landing.unlimitedProperties'),
    t('landing.smsEmailNotifications'),
    t('landing.support247')
  ];

  const stats = [
    { value: '500+', label: t('landing.propertiesManaged') },
    { value: '2,000+', label: t('landing.happyTenants') },
    { value: '99.9%', label: t('landing.uptime') },
    { value: '24/7', label: t('landing.support') }
  ];

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-2xl font-bold text-primary">Renta</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/apply-agent">Become an Agent</Link>
              </Button>
              <Button
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => setIsDemoModalOpen(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                Request Demo
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Trusted by property owners across Rwanda
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Property Management
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Renta helps Rwandan landlords manage their properties, track tenants,
              collect rent, and handle maintenance - all in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-base h-12 px-8" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
                <Link href="/login">Sign In to Dashboard</Link>
              </Button>
            </div>

            {/* Benefits list */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Properties
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From tenant management to payment tracking, Renta provides all the tools
              you need to run your rental business efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-muted/50 to-muted/30 p-8 hover:shadow-xl transition-all duration-500"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500" />

                  {/* Icon container */}
                  <div className="relative w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom line accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Renta Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Why Property Owners Choose Renta
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We understand the unique challenges of property management in Rwanda.
                That's why we built Renta with features specifically designed for local needs.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Mobile Money Integration</h3>
                    <p className="text-muted-foreground">Track MoMo payments easily with our seamless payment recording system.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">SMS Notifications</h3>
                    <p className="text-muted-foreground">Send payment reminders and updates to tenants via SMS.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Secure & Reliable</h3>
                    <p className="text-muted-foreground">Your data is safe with enterprise-grade security and 99.9% uptime.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Save Time</h3>
                    <p className="text-muted-foreground">Automate repetitive tasks and focus on growing your portfolio.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 lg:p-6">
                <div className="rounded-xl overflow-hidden shadow-2xl border bg-background">
                  <img
                    src="/dashboard-preview.png"
                    alt="Renta Dashboard Preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Simplify Your Property Management?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of property owners across Rwanda who are using Renta
            to manage their properties more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-base h-12 px-8" asChild>
              <Link href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base h-12 px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
              onClick={() => setIsDemoModalOpen(true)}
            >
              <Play className="mr-2 h-4 w-4" />
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-xl font-bold">Renta</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
              <Link href="/apply-agent" className="hover:text-foreground transition-colors">Become an Agent</Link>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Renta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
