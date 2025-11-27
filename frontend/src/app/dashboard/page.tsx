'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import { tenantPortalApi, DashboardData as TenantDashboardData } from '@/lib/api/tenant-portal';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { sessionManager } from '@/lib/session';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  Home,
  TrendingUp,
  ClipboardList,
  Shield,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

type UserRole = 'super_admin' | 'agency' | 'owner' | 'manager' | 'tenant' | 'maintenance' | 'agent';

// Role-specific welcome messages
const getWelcomeMessage = (role: UserRole | null): string => {
  switch (role) {
    case 'super_admin':
      return "Welcome to the admin panel. Here's a platform-wide overview.";
    case 'agency':
      return "Welcome back! Here's an overview of properties you manage.";
    case 'owner':
      return "Welcome back! Here's an overview of your properties.";
    case 'manager':
      return "Welcome back! Here's an overview of properties you manage.";
    case 'tenant':
      return "Welcome to your tenant portal. View your unit and payments.";
    case 'maintenance':
      return "Welcome! Here are your assigned maintenance tickets.";
    case 'agent':
      return "Welcome! Access your agent dashboard to assist owners and tenants.";
    default:
      return "Welcome back!";
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tenantData, setTenantData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const role = sessionManager.getUserRole() as UserRole | null;
    const user = sessionManager.getUser();
    setUserRole(role);
    if (user) {
      setUserName(user.firstName || user.email);
    }

    // Load role-specific dashboard data
    if (role === 'owner' || role === 'agency') {
      loadStats();
    } else if (role === 'tenant') {
      loadTenantDashboard();
    } else {
      setLoading(false);
    }
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTenantDashboard = async () => {
    try {
      const data = await tenantPortalApi.getDashboard();
      setTenantData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
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

  // Render role-specific placeholder dashboards
  const renderRoleDashboard = () => {
    switch (userRole) {
      case 'super_admin':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Super Admin Dashboard
                </CardTitle>
                <CardDescription>
                  Platform administration and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Navigate to the Users, Agencies, or Properties sections in the sidebar to manage the platform.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'tenant':
        if (!tenantData) {
          return (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Tenant Portal
                  </CardTitle>
                  <CardDescription>
                    Manage your rental and submit maintenance requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {error || 'No tenant profile found. Please contact your landlord.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Unit</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tenantData.unit?.unitNumber || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">{tenantData.property?.name}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(tenantData.rentAmount)}</div>
                  <p className="text-xs text-muted-foreground">Due monthly</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  {tenantData.currentMonthPaid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tenantData.currentMonthPaid ? 'Paid' : 'Due'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tenantData.currentPeriod.month}/{tenantData.currentPeriod.year}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tenantData.maintenanceTickets?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Active tickets</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Property</p>
                      <p className="font-medium">{tenantData.property?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{tenantData.property?.address}, {tenantData.property?.city}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/tenant/unit">View Unit Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Recent Payments
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/tenant/payments">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {tenantData.recentPayments && tenantData.recentPayments.length > 0 ? (
                    <div className="space-y-3">
                      {tenantData.recentPayments.slice(0, 5).map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.periodMonth}/{payment.periodYear}
                            </p>
                          </div>
                          <Badge variant="secondary">{formatDate(payment.paymentDate)}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No payments recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Maintenance Tickets */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Requests
                </CardTitle>
                <Button size="sm" asChild>
                  <Link href="/dashboard/tenant/maintenance">
                    <Plus className="h-4 w-4 mr-1" />
                    New Request
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {tenantData.maintenanceTickets && tenantData.maintenanceTickets.length > 0 ? (
                  <div className="space-y-3">
                    {tenantData.maintenanceTickets.map((ticket: any) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{ticket.category}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ticket.status === 'completed' ? 'default' :
                              ticket.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No maintenance requests</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'manager':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Property Manager Dashboard
                </CardTitle>
                <CardDescription>
                  View and manage assigned properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Navigate to Properties to see properties assigned to you by owners. Your access is determined by the permissions granted.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Maintenance Staff Dashboard
                </CardTitle>
                <CardDescription>
                  View and manage your assigned tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Navigate to My Tickets to see maintenance requests assigned to you.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  // For non-owner/agency roles, show role-specific dashboard
  if (userRole && userRole !== 'owner' && userRole !== 'agency') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {getWelcomeMessage(userRole)}
          </p>
        </div>
        {renderRoleDashboard()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {getWelcomeMessage(userRole)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Properties"
          value={stats?.overview.totalProperties || 0}
          icon={Building2}
        />
        <StatsCard
          title="Total Units"
          value={stats?.overview.totalUnits || 0}
          description={`${stats?.overview.occupiedUnits || 0} occupied, ${stats?.overview.vacantUnits || 0} vacant`}
          icon={Home}
        />
        <StatsCard
          title="Occupancy Rate"
          value={`${stats?.overview.occupancyRate || 0}%`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Active Tenants"
          value={stats?.overview.activeTenants || 0}
          description={stats?.overview.lateTenants ? `${stats.overview.lateTenants} late` : undefined}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.overview.totalRevenue || 0)}
          description={`${stats?.currentPeriod.month}/${stats?.currentPeriod.year}`}
          icon={CreditCard}
        />
        <StatsCard
          title="Pending Maintenance"
          value={stats?.overview.pendingMaintenance || 0}
          icon={Wrench}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {payment.tenant?.firstName || ''} {payment.tenant?.lastName || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.unit?.property?.name || 'Unknown Property'} - Unit {payment.unit?.unitNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent payments
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance</CardTitle>
            <CardDescription>Latest maintenance tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentMaintenance && stats.recentMaintenance.length > 0 ? (
              <div className="space-y-4">
                {stats.recentMaintenance.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium capitalize">{ticket.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.unit?.property?.name || 'Unknown Property'} - Unit {ticket.unit?.unitNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)} className="ml-1">
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No maintenance tickets
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
