'use client';

import { useEffect, useState } from 'react';
import { tenantPortalApi, Payment, PaginatedResponse } from '@/lib/api/tenant-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

export default function TenantPaymentsPage() {
  const { t, locale } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    loadPayments(1);
  }, []);

  const loadPayments = async (page: number) => {
    try {
      setLoading(true);
      const response = await tenantPortalApi.getPayments(page, 10);
      setPayments(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('common.completed')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            {t('common.pending')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            {t('tenant.paymentFailed')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('tenant.paymentHistory')}</h1>
        <p className="text-muted-foreground">{t('tenant.viewAllPayments')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('nav.payments')}
          </CardTitle>
          <CardDescription>
            {t('tenant.completePaymentHistory')} ({pagination.total} {t('common.total')})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-destructive py-8">{error}</p>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('tenant.noPaymentsFound')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tenant.paymentPeriod')}</TableHead>
                    <TableHead>{t('common.amount')}</TableHead>
                    <TableHead>{t('tenant.paymentDate')}</TableHead>
                    <TableHead>{t('tenant.paymentMethod')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {getMonthName(payment.periodMonth)} {payment.periodYear}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="capitalize">
                        {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPayments(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('common.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPayments(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      {t('common.next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
