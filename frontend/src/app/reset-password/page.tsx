'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Building2, ArrowRight, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsInvalidToken(true);
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 400 || response.status === 401) {
          setIsInvalidToken(true);
        } else {
          setError(data.message || 'Failed to reset password. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Invalid/Expired Token State
  if (isInvalidToken) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#37353E] mb-2">Invalid or expired link</h2>
        <p className="text-[#44444E] mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#37353E] hover:bg-[#44444E] text-white rounded-xl font-medium transition-all group"
        >
          Request new link
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  // Success State
  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#37353E] mb-2">Password reset successful!</h2>
        <p className="text-[#44444E] mb-8">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#37353E] hover:bg-[#44444E] text-white rounded-xl font-medium transition-all group"
        >
          Sign in to your account
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#37353E]">Create new password</h2>
        <p className="mt-2 text-[#44444E]">
          Your new password must be different from previously used passwords.
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
          <Label htmlFor="password" className="text-[#37353E] font-medium">
            New password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#44444E]/50" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="pl-12 pr-12 h-12 bg-[#F8F9FA] border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#715A5A] focus:ring-[#715A5A]/20 transition-all"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#44444E]/50 hover:text-[#44444E] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-[#44444E]">
                Password strength: <span className="font-medium">{strengthLabels[passwordStrength - 1] || 'Too short'}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[#37353E] font-medium">
            Confirm new password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#44444E]/50" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-12 pr-12 h-12 bg-[#F8F9FA] border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#715A5A] focus:ring-[#715A5A]/20 transition-all"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#44444E]/50 hover:text-[#44444E] transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <p className={`text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
              {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-[#F8F9FA] rounded-xl p-4">
          <p className="text-sm font-medium text-[#37353E] mb-2">Password requirements:</p>
          <ul className="space-y-1.5 text-sm">
            {[
              { check: formData.password.length >= 8, text: 'At least 8 characters' },
              { check: /[a-z]/.test(formData.password), text: 'One lowercase letter' },
              { check: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
              { check: /[0-9]/.test(formData.password), text: 'One number' },
              { check: /[^a-zA-Z0-9]/.test(formData.password), text: 'One special character (optional)' }
            ].map((req, i) => (
              <li key={i} className={`flex items-center gap-2 ${req.check ? 'text-green-600' : 'text-[#44444E]/60'}`}>
                {req.check ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                {req.text}
              </li>
            ))}
          </ul>
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
              Reset password
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      {/* Back to Login */}
      <p className="mt-8 text-center text-sm text-[#44444E]">
        Remember your password?{' '}
        <Link href="/login" className="text-[#715A5A] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#37353E] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-[#715A5A] rounded-full blur-3xl" />
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
              Almost there,
              <br />
              <span className="text-[#D3DAD9]">set a new password</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              Choose a strong password to keep your account secure. You&apos;ll use this to sign in to Renta.
            </p>

            {/* Security Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#715A5A] flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Your security matters</h3>
                  <p className="text-white/60 text-sm">
                    We use industry-standard encryption to protect your password. Never share your password with anyone.
                  </p>
                </div>
              </div>
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

          <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
