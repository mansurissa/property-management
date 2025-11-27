'use client';

import { useEffect, useState } from 'react';
import { managerPortalApi, ManagerProperty, ManagerTenant } from '@/lib/api/manager-portal';
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
import { Users, Building2, AlertCircle, Mail, Phone } from 'lucide-react';

export default function ManagerTenantsPage() {
  const [properties, setProperties] = useState<ManagerProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [tenants, setTenants] = useState<ManagerTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantsError, setTenantsError] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadTenants(selectedPropertyId);
    } else {
      setTenants([]);
    }
  }, [selectedPropertyId]);

  const loadProperties = async () => {
    try {
      const data = await managerPortalApi.getProperties();
      // Filter to only properties where manager can view tenants
      const propertiesWithTenantAccess = data.filter(p => p.permissions.canViewTenants);
      setProperties(propertiesWithTenantAccess);
      if (propertiesWithTenantAccess.length > 0) {
        setSelectedPropertyId(propertiesWithTenantAccess[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async (propertyId: string) => {
    setTenantsLoading(true);
    setTenantsError('');
    try {
      const data = await managerPortalApi.getPropertyTenants(propertyId);
      setTenants(data);
    } catch (err: any) {
      setTenantsError(err.message || 'Failed to load tenants');
      setTenants([]);
    } finally {
      setTenantsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">View tenants from your assigned properties</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tenant Access</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have permission to view tenants for any of your assigned properties. Contact the property owner to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">View tenants from your assigned properties</p>
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

      {tenantsLoading ? (
        <Skeleton className="h-64" />
      ) : tenantsError ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">{tenantsError}</p>
          </CardContent>
        </Card>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tenants</h3>
            <p className="text-muted-foreground text-center">
              No tenants found for this property.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenants ({tenants.length})
            </CardTitle>
            <CardDescription>
              Tenants currently renting units in this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Lease Period</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.firstName} {tenant.lastName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.unit ? `Unit ${tenant.unit.unitNumber}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {tenant.email}
                        </div>
                        {tenant.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(tenant.leaseStart)}</p>
                        <p className="text-muted-foreground">to {formatDate(tenant.leaseEnd)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(tenant.rentAmount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tenant.status)}
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
