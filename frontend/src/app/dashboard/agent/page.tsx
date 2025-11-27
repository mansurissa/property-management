'use client';

import { useEffect, useState } from 'react';
import { agentPortalApi, AgentDashboard } from '@/lib/api/agent-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  Building2,
  Users,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AgentDashboardPage() {
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await agentPortalApi.getDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string, actionTypes: Record<string, string>) => {
    return actionTypes[actionType] || actionType;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
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

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your performance summary.
        </p>
      </div>

      {/* Stats Cards */}
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
                  {formatCurrency(dashboard.earnings.totalEarned)}
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
                  {formatCurrency(dashboard.earnings.totalPending)}
                </p>
              </div>
            </div>
            {dashboard.pendingCommissionsCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {dashboard.pendingCommissionsCount} pending commissions
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Out</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(dashboard.earnings.totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{dashboard.earnings.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assist Property Owners
            </CardTitle>
            <CardDescription>
              Help owners register properties, add tenants, and record payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/agent/assist-owner">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assist Tenants
            </CardTitle>
            <CardDescription>
              Help tenants update info, record payments, and submit maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/agent/assist-tenant">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest agent activities</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/agent/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {dashboard.recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Start assisting owners and tenants to earn commissions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getActionTypeLabel(tx.actionType, dashboard.actionTypes)}
                      </Badge>
                      {tx.commission && (
                        <Badge variant={tx.commission.status === 'paid' ? 'default' : 'secondary'}>
                          {tx.commission.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">
                      {tx.targetUser
                        ? `${tx.targetUser.firstName} ${tx.targetUser.lastName}`
                        : tx.targetTenant
                          ? `${tx.targetTenant.firstName} ${tx.targetTenant.lastName}`
                          : 'N/A'}
                    </p>
                    {tx.description && (
                      <p className="text-sm text-muted-foreground">{tx.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {tx.commission && (
                      <p className="font-medium text-green-600">
                        {formatCurrency(tx.commission.amount)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
