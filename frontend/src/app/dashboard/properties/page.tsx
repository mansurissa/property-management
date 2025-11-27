'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, MoreVertical, Building2, MapPin, Home, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (err) {
      toast.error('Failed to load properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProperty) return;

    setDeleting(true);
    try {
      await propertiesApi.delete(deleteProperty.id);
      setProperties(properties.filter(p => p.id !== deleteProperty.id));
      toast.success('Property deleted successfully');
      setDeleteProperty(null);
    } catch (err) {
      toast.error('Failed to delete property');
      console.error(err);
    } finally {
      setDeleting(false);
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

  const getUnitStats = (property: Property) => {
    if (!property.units || property.units.length === 0) {
      return { total: 0, occupied: 0, vacant: 0 };
    }
    const total = property.units.length;
    const occupied = property.units.filter(u => u.status === 'occupied').length;
    const vacant = property.units.filter(u => u.status === 'vacant').length;
    return { total, occupied, vacant };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental properties
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first property
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const stats = getUnitStats(property);
            return (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="hover:underline"
                      >
                        {property.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}, {property.city}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/properties/${property.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/properties/${property.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/properties/${property.id}/units`}>
                          <Home className="mr-2 h-4 w-4" />
                          Manage Units
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteProperty(property)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">
                      {getPropertyTypeLabel(property.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{stats.total} units</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600">{stats.occupied} occupied</span>
                      <span className="text-orange-600">{stats.vacant} vacant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProperty} onOpenChange={() => setDeleteProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteProperty?.name}&quot;? This action cannot be undone and will also delete all associated units.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProperty(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
