'use client';

import { useEffect, useState } from 'react';
import { agentPortalApi, AgentTransaction } from '@/lib/api/agent-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Activity,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AgentTransactionsPage() {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const data = await agentPortalApi.getTransactions(page, 20);
      setTransactions(data.transactions);
      setPagination({ total: data.total, page, pages: data.pages });
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'property_registration': 'Property Registration',
      'tenant_onboarding': 'Tenant Onboarding',
      'rent_collection': 'Rent Collection',
      'maintenance_submission': 'Maintenance Request',
      'tenant_info_update': 'Tenant Info Update',
      'lease_renewal': 'Lease Renewal'
    };
    return labels[actionType] || actionType;
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-700">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            All your agent activities and earned commissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transactions ({pagination.total})
          </CardTitle>
          <CardDescription>
            Your complete transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Start assisting owners and tenants to see your transactions here
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/agent/assist-owner">Get Started</Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Badge variant="outline">{getActionTypeLabel(tx.actionType)}</Badge>
                      </TableCell>
                      <TableCell>
                        {tx.targetUser ? (
                          <div>
                            <p className="font-medium">
                              {tx.targetUser.firstName} {tx.targetUser.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">Owner</p>
                          </div>
                        ) : tx.targetTenant ? (
                          <div>
                            <p className="font-medium">
                              {tx.targetTenant.firstName} {tx.targetTenant.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">Tenant</p>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[200px] truncate">
                          {tx.description || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {tx.commission ? (
                          <p className="font-medium text-green-600">
                            {formatCurrency(tx.commission.amount)}
                          </p>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {tx.commission ? getCommissionStatusBadge(tx.commission.status) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => loadTransactions(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => loadTransactions(pagination.page + 1)}
                    >
                      Next
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
