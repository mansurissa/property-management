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
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function PropertiesPage() {
  const { t } = useLanguage();
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
      toast.error(t('owner.failedToLoadProperties'));
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
      toast.success(t('owner.propertyDeletedSuccess'));
      setDeleteProperty(null);
    } catch (err) {
      toast.error(t('owner.failedToDeleteProperty'));
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: t('owner.apartment'),
      house: t('owner.house'),
      commercial: t('owner.commercial'),
      other: t('owner.other')
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
          <h1 className="text-3xl font-bold">{t('owner.properties')}</h1>
          <p className="text-muted-foreground">
            {t('owner.manageRentalProperties')}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('owner.addProperty')}
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('owner.noPropertiesYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('owner.getStartedAddProperty')}
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('owner.addProperty')}
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
                          {t('owner.viewDetails')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/properties/${property.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/properties/${property.id}/units`}>
                          <Home className="mr-2 h-4 w-4" />
                          {t('owner.manageUnits')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteProperty(property)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
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
                      <span>{stats.total} {t('owner.units')}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600">{stats.occupied} {t('dashboard.occupied')}</span>
                      <span className="text-orange-600">{stats.vacant} {t('dashboard.vacant')}</span>
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
            <DialogTitle>{t('owner.deleteProperty')}</DialogTitle>
            <DialogDescription>
              {t('owner.deletePropertyConfirm')} &quot;{deleteProperty?.name}&quot;? {t('owner.deletePropertyWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProperty(null)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('owner.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
