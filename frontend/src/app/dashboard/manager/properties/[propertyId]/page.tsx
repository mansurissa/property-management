'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { managerPortalApi, ManagerProperty } from '@/lib/api/manager-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  MapPin,
  Home,
  ArrowLeft,
  Users,
  CreditCard,
  Wrench,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';

export default function ManagerPropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const [property, setProperty] = useState<ManagerProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const data = await managerPortalApi.getPropertyById(propertyId);
      setProperty(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'occupied':
        return <Badge className="bg-green-500">Occupied</Badge>;
      case 'vacant':
        return <Badge variant="secondary">Vacant</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Maintenance</Badge>;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/manager/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error || 'Property not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/manager/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{property.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {property.address}, {property.city}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(property.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{property.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Units</span>
              <span className="font-medium">{property.units?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Owner Info */}
        {property.owner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Property Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-lg">
                  {property.owner.firstName} {property.owner.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{property.owner.email}</span>
              </div>
              {property.owner.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{property.owner.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Your Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>What you can access for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={`p-4 rounded-lg border ${property.permissions.canViewTenants ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-muted'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">Tenants</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {property.permissions.canViewTenants ? 'You can view tenants' : 'No access to tenants'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${property.permissions.canViewPayments ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-muted'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Payments</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {property.permissions.canViewPayments ? 'You can view payments' : 'No access to payments'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${property.permissions.canViewMaintenance ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-muted'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-5 w-5" />
                <span className="font-medium">Maintenance</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {property.permissions.canViewMaintenance
                  ? `View${property.permissions.canCreateMaintenance ? ', Create' : ''}${property.permissions.canUpdateMaintenance ? ', Update' : ''}`
                  : 'No access to maintenance'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units */}
      {property.units && property.units.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Units ({property.units.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {property.units.map((unit) => (
                <div key={unit.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Unit {unit.unitNumber}</span>
                    {getStatusBadge(unit.status)}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {unit.floor && <p>Floor: {unit.floor}</p>}
                    {unit.bedrooms && <p>Bedrooms: {unit.bedrooms}</p>}
                    {unit.bathrooms && <p>Bathrooms: {unit.bathrooms}</p>}
                    <p className="font-medium text-foreground">
                      Rent: {formatCurrency(unit.monthlyRent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
