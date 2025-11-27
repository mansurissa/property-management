'use client';

import { useEffect, useState } from 'react';
import { agentPortalApi, AgentEarnings, AgentCommission } from '@/lib/api/agent-portal';
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
  DollarSign,
  ArrowLeft,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function AgentEarningsPage() {
  const [summary, setSummary] = useState<AgentEarnings | null>(null);
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const data = await agentPortalApi.getEarnings();
      setSummary(data.summary);
      setCommissions(data.commissions);
    } catch (err: any) {
      console.error('Failed to load earnings:', err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
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
          <h1 className="text-3xl font-bold">My Earnings</h1>
          <p className="text-muted-foreground">
            Track your commissions and earnings
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalEarned)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summary.totalPending)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Out</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.totalPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commissions</p>
                  <p className="text-2xl font-bold">{summary.commissionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission History
          </CardTitle>
          <CardDescription>
            All your earned commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Commissions Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Start helping owners and tenants to earn commissions
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/agent/assist-owner">Get Started</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {commission.transaction ? (
                        <div>
                          <Badge variant="outline">
                            {getActionTypeLabel(commission.transaction.actionType)}
                          </Badge>
                          {commission.transaction.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {commission.transaction.description}
                            </p>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(commission.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(commission.status)}
                    </TableCell>
                    <TableCell>{formatDate(commission.createdAt)}</TableCell>
                    <TableCell>
                      {commission.paidAt ? formatDate(commission.paidAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">How Commissions Work</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>- Commissions are earned when you help owners and tenants with various actions</li>
            <li>- Each action type has its own commission rate set by the admin</li>
            <li>- Pending commissions will be marked as paid when processed by admin</li>
            <li>- Your total earnings include both pending and paid commissions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
