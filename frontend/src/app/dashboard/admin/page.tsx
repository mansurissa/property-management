'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, AdminStats } from '@/lib/api/admin';
import { demoRequestsApi, DemoRequestStats } from '@/lib/api/demo-requests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Building2,
  Home,
  UserCheck,
  DollarSign,
  Wrench,
  TrendingUp,
  UserPlus,
  Play,
  ArrowRight,
  RefreshCw,
  Clock,
  Activity
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [demoStats, setDemoStats] = useState<DemoRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [adminData, demoData] = await Promise.all([
        adminApi.getStats(),
        demoRequestsApi.getStats()
      ]);
      setStats(adminData);
      setDemoStats(demoData);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleCount = (role: string): number => {
    if (!stats?.usersByRole) return 0;
    const found = stats.usersByRole.find(r => r.role === role);
    return found ? parseInt(found.count) : 0;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Platform overview and statistics for {stats?.currentPeriod?.month}/{stats?.currentPeriod?.year}
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Main Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats.overview.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Properties</p>
                    <p className="text-3xl font-bold">{stats.overview.totalProperties}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                    <p className="text-3xl font-bold">{stats.overview.totalUnits}</p>
                  </div>
                  <Home className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tenants</p>
                    <p className="text-3xl font-bold">{stats.overview.totalTenants}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.overview.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.overview.occupancyRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  {stats.overview.occupiedUnits} occupied / {stats.overview.vacantUnits} vacant
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Pending Maintenance</p>
                    <p className="text-2xl font-bold text-amber-800">{stats.overview.pendingMaintenance}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            {demoStats && (
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Pending Demos</p>
                      <p className="text-2xl font-bold text-purple-800">{demoStats.pending}</p>
                    </div>
                    <Play className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    {demoStats.recentCount} in last 7 days
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Users by Role & Recent Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users by Role
                </CardTitle>
                <CardDescription>
                  Distribution of users across different roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: 'super_admin', label: 'Super Admins', color: 'bg-red-500' },
                    { role: 'agency', label: 'Agencies', color: 'bg-blue-500' },
                    { role: 'owner', label: 'Owners', color: 'bg-green-500' },
                    { role: 'manager', label: 'Managers', color: 'bg-purple-500' },
                    { role: 'tenant', label: 'Tenants', color: 'bg-orange-500' },
                    { role: 'maintenance', label: 'Maintenance', color: 'bg-amber-500' },
                    { role: 'agent', label: 'Agents', color: 'bg-cyan-500' }
                  ].map(({ role, label, color }) => {
                    const count = getRoleCount(role);
                    const percentage = stats.overview.totalUsers > 0
                      ? Math.round((count / stats.overview.totalUsers) * 100)
                      : 0;
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-sm">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>
                  Latest users registered on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentUsers.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {user.role.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/admin/users">
                  <Button variant="ghost" className="w-full mt-4">
                    View All Users
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/admin/users">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Manage Users</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/agencies">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">View Agencies</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/demo-requests">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 relative">
                    <Play className="h-5 w-5" />
                    <span className="text-xs">Demo Requests</span>
                    {demoStats && demoStats.pending > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                        {demoStats.pending}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/dashboard/admin/agents/applications">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">Agent Applications</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Demo Request Summary */}
          {demoStats && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Demo Requests Overview
                  </CardTitle>
                  <CardDescription>
                    Summary of demo request statuses
                  </CardDescription>
                </div>
                <Link href="/dashboard/admin/demo-requests">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{demoStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50">
                    <p className="text-2xl font-bold text-yellow-700">{demoStats.pending}</p>
                    <p className="text-xs text-yellow-600">Pending</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-700">{demoStats.contacted}</p>
                    <p className="text-xs text-blue-600">Contacted</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-50">
                    <p className="text-2xl font-bold text-purple-700">{demoStats.scheduled}</p>
                    <p className="text-xs text-purple-600">Scheduled</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-700">{demoStats.completed}</p>
                    <p className="text-xs text-green-600">Completed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-700">{demoStats.cancelled}</p>
                    <p className="text-xs text-red-600">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
