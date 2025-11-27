'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Home,
  Wrench,
  Download,
  Calendar
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  totalRevenue: number;
  pendingMaintenance: number;
  newUsersThisMonth: number;
  newPropertiesThisMonth: number;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<DashboardStats>(`/api/admin/reports/dashboard?period=${period}`);
      setStats(response);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      // Set default stats for demo
      setStats({
        totalUsers: 0,
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        totalRevenue: 0,
        pendingMaintenance: 0,
        newUsersThisMonth: 0,
        newPropertiesThisMonth: 0
      });
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

  const getOccupancyRate = () => {
    if (!stats || stats.totalUnits === 0) return 0;
    return Math.round((stats.occupiedUnits / stats.totalUnits) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            System-wide statistics and reports
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats?.newUsersThisMonth || 0} this month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-3xl font-bold">{stats?.totalProperties || 0}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats?.newPropertiesThisMonth || 0} this month
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All time
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-3xl font-bold">{getOccupancyRate()}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats?.occupiedUnits || 0} / {stats?.totalUnits || 0} units
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Property Distribution
            </CardTitle>
            <CardDescription>
              Properties by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Apartments</span>
                </div>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Houses</span>
                </div>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span>Commercial</span>
                </div>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>Mixed Use</span>
                </div>
                <span className="font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Overview
            </CardTitle>
            <CardDescription>
              Current maintenance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span>Pending Requests</span>
                <span className="font-bold text-yellow-600">{stats?.pendingMaintenance || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span>In Progress</span>
                <span className="font-bold text-blue-600">-</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span>Completed This Month</span>
                <span className="font-bold text-green-600">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Distribution by Role
          </CardTitle>
          <CardDescription>
            Breakdown of users by their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">-</p>
              <p className="text-sm text-muted-foreground">Super Admins</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">-</p>
              <p className="text-sm text-muted-foreground">Agencies</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-muted-foreground">Owners</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-cyan-600">-</p>
              <p className="text-sm text-muted-foreground">Managers</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-muted-foreground">Tenants</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600">-</p>
              <p className="text-sm text-muted-foreground">Agents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Note: Some statistics require additional backend endpoints to be fully functional.
            The data shown represents available system metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
