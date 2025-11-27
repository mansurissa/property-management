'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { paymentsApi, TenantBalance, Payment } from '@/lib/api/payments';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Unit } from '@/lib/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil, Users, Phone, Mail, Home, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantDetailsPage() {
  const params = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [balance, setBalance] = useState<TenantBalance | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadTenantData(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty);
      const vacantUnits = property?.units?.filter(u => u.status === 'vacant') || [];
      setAvailableUnits(vacantUnits);
      setSelectedUnit('');
    }
  }, [selectedProperty, properties]);

  const loadTenantData = async (id: string) => {
    try {
      const [tenantData, paymentsData] = await Promise.all([
        tenantsApi.getById(id),
        paymentsApi.getTenantPayments(id)
      ]);
      setTenant(tenantData);
      setPayments(paymentsData);

      if (tenantData.unitId) {
        const balanceData = await paymentsApi.getTenantBalance(id);
        setBalance(balanceData);
      }
    } catch (err) {
      toast.error('Failed to load tenant data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (err) {
      toast.error('Failed to load properties');
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    setAssigning(true);
    try {
      const updatedTenant = await tenantsApi.assign(params.id as string, selectedUnit);
      setTenant(updatedTenant);
      setShowAssignDialog(false);
      toast.success('Tenant assigned to unit successfully');
      loadTenantData(params.id as string);
    } catch (err) {
      toast.error('Failed to assign tenant');
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!tenant?.unitId) return;

    setAssigning(true);
    try {
      await tenantsApi.unassign(params.id as string);
      toast.success('Tenant unassigned from unit');
      loadTenantData(params.id as string);
    } catch (err) {
      toast.error('Failed to unassign tenant');
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const openAssignDialog = () => {
    loadProperties();
    setShowAssignDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'late':
        return <Badge className="bg-red-100 text-red-800">Late</Badge>;
      case 'exited':
        return <Badge className="bg-gray-100 text-gray-800">Exited</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Tenant not found</h3>
        <Button asChild>
          <Link href="/dashboard/tenants">Back to Tenants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/tenants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {tenant.firstName} {tenant.lastName}
              </h1>
              {getStatusBadge(tenant.status)}
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {tenant.phone}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.unit ? (
              <div>
                <p className="text-lg font-bold">{tenant.unit.property?.name}</p>
                <p className="text-muted-foreground">Unit {tenant.unit.unitNumber}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleUnassign}
                  disabled={assigning}
                >
                  Unassign
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">Not assigned</p>
                <Button size="sm" onClick={openAssignDialog}>
                  Assign Unit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tenant.unit ? formatCurrency(tenant.unit.monthlyRent) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balance ? (
              <div>
                <p className={`text-2xl font-bold ${balance.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance.balance)}
                </p>
                {balance.monthsOwed > 0 && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {balance.monthsOwed} month(s) owed
                  </p>
                )}
              </div>
            ) : (
              <p className="text-2xl font-bold">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {tenant.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {tenant.email || '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">National ID</p>
                <p className="font-medium">{tenant.nationalId || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p className="font-medium">{tenant.emergencyContact || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Phone</p>
                  <p className="font-medium">{tenant.emergencyPhone || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lease Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lease Start</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {tenant.leaseStartDate ? formatDate(tenant.leaseStartDate) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lease End</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {tenant.leaseEndDate ? formatDate(tenant.leaseEndDate) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All payments made by this tenant</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/dashboard/payments/new?tenantId=${tenant.id}`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>{getMonthName(payment.periodMonth)} {payment.periodYear}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Record a payment for this tenant
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/payments/new?tenantId=${tenant.id}`}>
                      Record Payment
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Unit Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Unit</DialogTitle>
            <DialogDescription>
              Assign {tenant.firstName} {tenant.lastName} to a unit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
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
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={selectedUnit}
                onValueChange={setSelectedUnit}
                disabled={!selectedProperty || availableUnits.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedProperty ? "Select property first" :
                    availableUnits.length === 0 ? "No vacant units" :
                    "Select unit"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unitNumber} - {formatCurrency(unit.monthlyRent)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning || !selectedUnit}>
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
