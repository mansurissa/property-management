'use client';

import { useEffect, useState } from 'react';
import { managerPortalApi, ManagerProperty } from '@/lib/api/manager-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, MapPin, Home, Eye, Users, CreditCard, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function ManagerPropertiesPage() {
  const [properties, setProperties] = useState<ManagerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await managerPortalApi.getProperties();
      setProperties(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'Apartment Building',
      house: 'House',
      commercial: 'Commercial',
      mixed: 'Mixed Use'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Properties</h1>
        <p className="text-muted-foreground">
          Properties assigned to you by property owners
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't been assigned to manage any properties yet. Property owners can assign you to their properties.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}, {property.city}
                    </CardDescription>
                  </div>
                  {getStatusBadge(property.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{getPropertyTypeLabel(property.type)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Units</span>
                  <span className="font-medium flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {property.units?.length || property.totalUnits || 0}
                  </span>
                </div>

                {/* Permissions */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Your Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {property.permissions.canViewTenants && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Tenants
                      </Badge>
                    )}
                    {property.permissions.canViewPayments && (
                      <Badge variant="outline" className="text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Payments
                      </Badge>
                    )}
                    {property.permissions.canViewMaintenance && (
                      <Badge variant="outline" className="text-xs">
                        <Wrench className="h-3 w-3 mr-1" />
                        Maintenance
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Owner info */}
                {property.owner && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Property Owner</p>
                    <p className="text-sm font-medium">
                      {property.owner.firstName} {property.owner.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{property.owner.email}</p>
                  </div>
                )}

                <Link href={`/dashboard/manager/properties/${property.id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
