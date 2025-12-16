'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sessionManager } from '@/lib/session';
import { authApi } from '@/lib/api/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Check if user was redirected due to session expiration
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      setSessionExpired(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError(t('auth.fillAllFields'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password
      });

      if (!response.success) {
        setError(response.message || t('auth.loginFailed'));
        setIsLoading(false);
        return;
      }

      // Use sessionManager to properly set the session
      sessionManager.setSession({
        token: response.data.token,
        user: response.data.user
      }, 24, true); // 24 hours, remember = true

      // Redirect to the page they were trying to access, or dashboard
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('auth.errorOccurred'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#37353E] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#715A5A] rounded-full blur-3xl" />
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
              {t('auth.manageProperties')}
              <br />
              <span className="text-[#D3DAD9]">{t('auth.withEase')}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {t('auth.platformSubtitle')}
            </p>

            {/* Features */}
            <div className="space-y-4 pt-6">
              {[
                t('auth.featureBullet1'),
                t('auth.featureBullet2'),
                t('auth.featureBullet3')
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#715A5A] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Renta. {t('auth.builtForRwanda')}.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#37353E] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-[#37353E]">Renta</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#37353E]">{t('auth.welcomeBack')}</h2>
            <p className="mt-2 text-[#44444E]">
              {t('auth.enterCredentials')}
            </p>
          </div>

          {/* Session Expired Message */}
          {sessionExpired && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-700">{t('auth.sessionExpiredMessage')}</p>
            </div>
          )}

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
                {t('auth.emailAddress')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#44444E]/50" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-12 h-12 bg-[#F8F9FA] border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#715A5A] focus:ring-[#715A5A]/20 transition-all"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#37353E] font-medium">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#44444E]/50" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-12 pr-12 h-12 bg-[#F8F9FA] border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#715A5A] focus:ring-[#715A5A]/20 transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#715A5A] focus:ring-[#715A5A]/20"
                />
                <span className="text-sm text-[#44444E]">{t('auth.rememberMe')}</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#715A5A] hover:text-[#5a4848] transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
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
                  {t('auth.signInBtn')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#44444E]">{t('auth.newToRenta')}</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 w-full h-12 border-2 border-[#E5E7EB] hover:border-[#715A5A] text-[#37353E] rounded-xl font-medium transition-all group"
          >
            {t('auth.createAccount')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Back to Home */}
          <p className="mt-8 text-center text-sm text-[#44444E]">
            <Link href="/" className="hover:text-[#715A5A] transition-colors">
              &larr; {t('auth.backToHome')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
