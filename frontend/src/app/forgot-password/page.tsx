'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Building2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        // Don't reveal if email exists or not for security
        // Still show success message
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still show success for security (don't reveal if email exists)
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#37353E] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-20 w-96 h-96 bg-[#715A5A] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white">Renta</span>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Don&apos;t worry,
              <br />
              <span className="text-[#D3DAD9]">we&apos;ve got you</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              It happens to the best of us. Enter your email and we&apos;ll send you instructions to reset your password.
            </p>

            {/* Security Tips */}
            <div className="space-y-4 pt-6">
              <p className="text-white/50 text-sm font-medium uppercase tracking-wider">Security Tips</p>
              {[
                'Use a strong, unique password',
                'Never share your password with anyone',
                'Enable two-factor authentication when available'
              ].map((tip, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#715A5A]/50 flex items-center justify-center">
                    <span className="text-white text-xs">{index + 1}</span>
                  </div>
                  <span className="text-white/70 text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Renta. Built for Rwandan landlords.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#37353E] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-[#37353E]">Renta</span>
          </div>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#37353E]">Forgot your password?</h2>
                <p className="mt-2 text-[#44444E]">
                  No worries! Enter your email and we&apos;ll send you reset instructions.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#37353E] font-medium">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#44444E]/50" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="pl-12 h-12 bg-[#F8F9FA] border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#715A5A] focus:ring-[#715A5A]/20 transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#37353E] hover:bg-[#44444E] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send reset instructions
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#37353E] mb-2">Check your email</h2>
              <p className="text-[#44444E] mb-6">
                We&apos;ve sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm text-[#44444E]/70 mb-8">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-[#715A5A] hover:underline font-medium"
                >
                  try another email
                </button>
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-8">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full h-12 border-2 border-[#E5E7EB] hover:border-[#715A5A] text-[#37353E] rounded-xl font-medium transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to sign in
            </Link>
          </div>

          {/* Back to Home */}
          <p className="mt-8 text-center text-sm text-[#44444E]">
            <Link href="/" className="hover:text-[#715A5A] transition-colors">
              &larr; Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
