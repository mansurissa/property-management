'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { paymentsApi, CreatePaymentData } from '@/lib/api/payments';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function NewPaymentPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTenantId = searchParams.get('tenantId');

  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<CreatePaymentData>({
    tenantId: '',
    unitId: '',
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    notes: '',
  });

  const paymentMethods = [
    { value: 'cash', label: t('owner.cash') },
    { value: 'momo', label: t('owner.momo') },
    { value: 'bank', label: t('owner.bank') },
  ];

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (preselectedTenantId && tenants.length > 0) {
      const tenant = tenants.find(t => t.id === preselectedTenantId);
      if (tenant) {
        handleTenantChange(tenant.id);
      }
    }
  }, [preselectedTenantId, tenants]);

  const loadTenants = async () => {
    try {
      const data = await tenantsApi.getAll('active');
      setTenants(data.filter(t => t.unitId));
    } catch (err) {
      toast.error(t('owner.failedToLoadTenants'));
      console.error(err);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant && tenant.unit) {
      setSelectedTenant(tenant);
      setFormData(prev => ({
        ...prev,
        tenantId: tenant.id,
        unitId: tenant.unit!.id,
        amount: tenant.unit!.monthlyRent
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenantId || !formData.unitId || !formData.amount || !formData.paymentDate) {
      toast.error(t('owner.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      await paymentsApi.create(formData);
      toast.success(t('owner.paymentRecordedSuccess'));
      router.push('/dashboard/payments');
    } catch (err) {
      toast.error(t('owner.failedToRecordPayment'));
      console.error(err);
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

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString(`${locale}-RW`, { month: 'long' });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i + 1);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('owner.recordPayment')}</h1>
          <p className="text-muted-foreground">
            {t('owner.recordNewPayment')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('owner.tenantSelection')}</CardTitle>
            <CardDescription>
              {t('owner.selectTenantMakingPayment')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">{t('owner.tenantLabel')}</Label>
              <Select
                value={formData.tenantId}
                onValueChange={handleTenantChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('owner.selectTenant')} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.firstName} {tenant.lastName} - {tenant.unit?.property?.name} ({t('owner.unit')} {tenant.unit?.unitNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && selectedTenant.unit && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t('owner.selectedUnit')}</p>
                <p className="font-medium">
                  {selectedTenant.unit.property?.name} - {t('owner.unit')} {selectedTenant.unit.unitNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('owner.monthlyRentLabel')}: {formatCurrency(selectedTenant.unit.monthlyRent)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('owner.paymentDetails')}</CardTitle>
            <CardDescription>
              {t('owner.enterPaymentInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('owner.amountLabel')}</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={t('owner.amountPlaceholder')}
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{t('owner.paymentMethodLabel')}</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'cash' | 'momo' | 'bank') => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('owner.selectMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">{t('owner.paymentDateLabel')}</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodMonth">{t('owner.forMonth')}</Label>
                <Select
                  value={formData.periodMonth.toString()}
                  onValueChange={(value) => setFormData({ ...formData, periodMonth: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('owner.selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodYear">{t('owner.forYear')}</Label>
                <Select
                  value={formData.periodYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, periodYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('owner.selectYear')} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('owner.notesLabel')}</Label>
              <Textarea
                id="notes"
                placeholder={t('owner.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? t('owner.recording') : t('owner.recordPaymentBtn')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/payments">{t('common.cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
