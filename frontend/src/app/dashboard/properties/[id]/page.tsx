'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Pencil, Home, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyDetailsPage() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadProperty(params.id as string);
    }
  }, [params.id]);

  const loadProperty = async (id: string) => {
    try {
      const data = await propertiesApi.getById(id);
      setProperty(data);
    } catch (err) {
      toast.error('Failed to load property');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Apartment',
      house: 'House',
      commercial: 'Commercial',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-green-100 text-green-800">Occupied</Badge>;
      case 'vacant':
        return <Badge className="bg-orange-100 text-orange-800">Vacant</Badge>;
      case 'maintenance':
        return <Badge className="bg-red-100 text-red-800">Maintenance</Badge>;
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

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Property not found</h3>
        <Button asChild>
          <Link href="/dashboard/properties">Back to Properties</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.city}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/properties/${property.id}/units`}>
              <Home className="mr-2 h-4 w-4" />
              Manage Units
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Property Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-lg">
              {getPropertyTypeLabel(property.type)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{property.units?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {property.units && property.units.length > 0 ? (
              <p className="text-2xl font-bold">
                {Math.round((property.units.filter(u => u.status === 'occupied').length / property.units.length) * 100)}%
              </p>
            ) : (
              <p className="text-2xl font-bold">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{property.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Units</CardTitle>
              <CardDescription>
                All units in this property
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/dashboard/properties/${property.id}/units`}>
                Manage Units
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {property.units && property.units.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Bedrooms</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                    <TableCell>{unit.floor || '-'}</TableCell>
                    <TableCell>{unit.bedrooms}</TableCell>
                    <TableCell>{formatCurrency(unit.monthlyRent)}</TableCell>
                    <TableCell>{getStatusBadge(unit.status)}</TableCell>
                    <TableCell>
                      {unit.tenant ? (
                        <Link
                          href={`/dashboard/tenants/${unit.tenant.id}`}
                          className="text-primary hover:underline"
                        >
                          {unit.tenant.firstName} {unit.tenant.lastName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No units yet</h3>
              <p className="text-muted-foreground mb-4">
                Add units to this property to start managing tenants
              </p>
              <Button asChild>
                <Link href={`/dashboard/properties/${property.id}/units`}>
                  Add Units
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
