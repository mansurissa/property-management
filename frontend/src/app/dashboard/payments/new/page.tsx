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

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile Money (MoMo)' },
  { value: 'bank', label: 'Bank Transfer' },
];

export default function NewPaymentPage() {
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
      toast.error('Failed to load tenants');
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
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await paymentsApi.create(formData);
      toast.success('Payment recorded successfully');
      router.push('/dashboard/payments');
    } catch (err) {
      toast.error('Failed to record payment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
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
          <h1 className="text-3xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">
            Record a rent payment from a tenant
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Selection</CardTitle>
            <CardDescription>
              Select the tenant making the payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={handleTenantChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.firstName} {tenant.lastName} - {tenant.unit?.property?.name} (Unit {tenant.unit?.unitNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && selectedTenant.unit && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Selected unit</p>
                <p className="font-medium">
                  {selectedTenant.unit.property?.name} - Unit {selectedTenant.unit.unitNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Monthly rent: {formatCurrency(selectedTenant.unit.monthlyRent)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Enter the payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RWF) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 150000"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'cash' | 'momo' | 'bank') => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
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
              <Label htmlFor="paymentDate">Payment Date *</Label>
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
                <Label htmlFor="periodMonth">For Month *</Label>
                <Select
                  value={formData.periodMonth.toString()}
                  onValueChange={(value) => setFormData({ ...formData, periodMonth: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
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
                <Label htmlFor="periodYear">For Year *</Label>
                <Select
                  value={formData.periodYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, periodYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this payment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/payments">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
