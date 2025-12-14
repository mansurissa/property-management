'use client';

import { useEffect, useState } from 'react';
import { tenantPortalApi, DashboardData } from '@/lib/api/tenant-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Home,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail
} from 'lucide-react';

export default function TenantUnitPage() {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashboardData = await tenantPortalApi.getDashboard();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Failed to load unit information');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(`${locale}-RW`, {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(`${locale}-RW`, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('tenant.myUnit')}</h1>
          <p className="text-muted-foreground">{t('tenant.viewUnitDetails')}</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-destructive">{error || t('errors.noData')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('tenant.myUnit')}</h1>
        <p className="text-muted-foreground">{t('tenant.viewUnitDetails')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Unit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {t('tenant.unitDetails')}
            </CardTitle>
            <CardDescription>{t('tenant.unitDetailsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tenant.unitNumber')}</p>
                <p className="text-xl font-bold">{data.unit?.unitNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tenant.monthlyRent')}</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.rentAmount)}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Badge variant={data.currentMonthPaid ? 'default' : 'destructive'}>
                {data.currentMonthPaid ? t('tenant.paid') : t('tenant.due')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('tenant.propertyDetails')}
            </CardTitle>
            <CardDescription>{t('tenant.propertyDetailsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tenant.propertyName')}</p>
                <p className="font-medium">{data.property?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tenant.propertyAddress')}</p>
                <p className="font-medium">{data.property?.address || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{data.property?.city || ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lease Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('tenant.leaseInfo')}
            </CardTitle>
            <CardDescription>{t('tenant.leaseInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('tenant.leaseStart')}</p>
                <p className="font-medium">
                  {data.profile?.leaseStart ? formatDate(data.profile.leaseStart) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tenant.leaseEnd')}</p>
                <p className="font-medium">
                  {data.profile?.leaseEnd ? formatDate(data.profile.leaseEnd) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('tenant.paymentSummary')}
            </CardTitle>
            <CardDescription>{t('tenant.paymentHistoryOverview')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t('tenant.totalPaid')}</p>
              <p className="text-2xl font-bold">{formatCurrency(data.totalPaid)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t('tenant.currentPeriod')}</p>
              <p className="font-medium">
                {data.currentPeriod.month}/{data.currentPeriod.year}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
