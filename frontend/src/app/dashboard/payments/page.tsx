'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { paymentsApi, Payment, PaymentFilters } from '@/lib/api/payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFilters>({
    periodMonth: undefined,
    periodYear: new Date().getFullYear(),
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      const data = await paymentsApi.getAll(filters);
      setPayments(data);
    } catch (err) {
      toast.error('Failed to load payments');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="secondary">Cash</Badge>;
      case 'momo':
        return <Badge className="bg-yellow-100 text-yellow-800">MoMo</Badge>;
      case 'bank':
        return <Badge className="bg-blue-100 text-blue-800">Bank</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1)
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            View and record rent payments
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Month</Label>
          <Select
            value={filters.periodMonth?.toString() || 'all'}
            onValueChange={(value) => setFilters({
              ...filters,
              periodMonth: value === 'all' ? undefined : parseInt(value)
            })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Year</Label>
          <Select
            value={filters.periodYear?.toString() || currentYear.toString()}
            onValueChange={(value) => setFilters({
              ...filters,
              periodYear: parseInt(value)
            })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
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

        {payments.length > 0 && (
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Total collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
          </div>
        )}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.periodMonth || filters.periodYear !== currentYear
                ? 'No payments for the selected period'
                : 'Start by recording your first payment'}
            </p>
            <Button asChild>
              <Link href="/dashboard/payments/new">
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {formatDate(payment.paymentDate)}
                  </TableCell>
                  <TableCell>
                    {payment.tenant ? (
                      <Link
                        href={`/dashboard/tenants/${payment.tenant.id}`}
                        className="font-medium hover:underline"
                      >
                        {payment.tenant.firstName} {payment.tenant.lastName}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.unit ? (
                      <div>
                        <p className="font-medium">{payment.unit.property?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Unit {payment.unit.unitNumber}
                        </p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {getMonthName(payment.periodMonth)} {payment.periodYear}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
