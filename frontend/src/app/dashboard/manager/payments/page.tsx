'use client';

import { useEffect, useState } from 'react';
import { managerPortalApi, ManagerProperty, ManagerPayment } from '@/lib/api/manager-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, Building2, AlertCircle } from 'lucide-react';

export default function ManagerPaymentsPage() {
  const [properties, setProperties] = useState<ManagerProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [payments, setPayments] = useState<ManagerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentsError, setPaymentsError] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadPayments(selectedPropertyId);
    } else {
      setPayments([]);
    }
  }, [selectedPropertyId]);

  const loadProperties = async () => {
    try {
      const data = await managerPortalApi.getProperties();
      // Filter to only properties where manager can view payments
      const propertiesWithPaymentAccess = data.filter(p => p.permissions.canViewPayments);
      setProperties(propertiesWithPaymentAccess);
      if (propertiesWithPaymentAccess.length > 0) {
        setSelectedPropertyId(propertiesWithPaymentAccess[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (propertyId: string) => {
    setPaymentsLoading(true);
    setPaymentsError('');
    try {
      const data = await managerPortalApi.getPropertyPayments(propertyId);
      setPayments(data);
    } catch (err: any) {
      setPaymentsError(err.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      mobile_money: 'Mobile Money',
      card: 'Card',
      check: 'Check'
    };
    return methods[method] || method;
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
      year: 'numeric',
      month: 'short',
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">View payments from your assigned properties</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Access</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have permission to view payments for any of your assigned properties. Contact the property owner to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = payments.filter(p => p.status === 'completed');
  const completedAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">View payments from your assigned properties</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Property:</span>
        </div>
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {payments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl">{payments.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Amount</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl text-green-600">{formatCurrency(completedAmount)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {paymentsLoading ? (
        <Skeleton className="h-64" />
      ) : paymentsError ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">{paymentsError}</p>
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payments</h3>
            <p className="text-muted-foreground text-center">
              No payments found for this property.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              All payments recorded for this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      {payment.tenant
                        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.tenant?.unit ? `Unit ${payment.tenant.unit.unitNumber}` : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.referenceNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
