'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { agentApplicationApi, AgentApplicationData } from '@/lib/api/agent-application';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ApplyAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<AgentApplicationData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    address: '',
    city: '',
    motivation: '',
    experience: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await agentApplicationApi.submit(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest in becoming a Renta Agent. We will review your application and contact you at <strong>{formData.email}</strong> soon.
              </p>
              <div className="space-y-2">
                <Link href="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">Back to Home</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Become a Renta Agent</CardTitle>
            <CardDescription>
              Join our network of property management agents and earn commissions by helping property owners and tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID (Optional)</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City (Optional)</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Previous Experience (Optional)</Label>
                <Textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Tell us about any relevant experience you have..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to become an agent? (Optional)</Label>
                <Textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  placeholder="Tell us why you're interested..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
