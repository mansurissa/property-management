'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi, Property } from '@/lib/api/properties';
import { unitsApi, CreateUnitData, UpdateUnitData } from '@/lib/api/units';
import { Unit } from '@/lib/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Plus, Pencil, Trash2, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyUnitsPage() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateUnitData>({
    propertyId: '',
    unitNumber: '',
    floor: undefined,
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 0,
    paymentDueDay: 1,
  });

  useEffect(() => {
    if (params.id) {
      loadPropertyAndUnits(params.id as string);
    }
  }, [params.id]);

  const loadPropertyAndUnits = async (id: string) => {
    try {
      const [propertyData, unitsData] = await Promise.all([
        propertiesApi.getById(id),
        unitsApi.getByProperty(id)
      ]);
      setProperty(propertyData);
      setUnits(unitsData);
      setFormData(prev => ({ ...prev, propertyId: id }));
    } catch (err) {
      toast.error('Failed to load property');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: params.id as string,
      unitNumber: '',
      floor: undefined,
      bedrooms: 1,
      bathrooms: 1,
      monthlyRent: 0,
      paymentDueDay: 1,
    });
  };

  const handleAddUnit = async () => {
    if (!formData.unitNumber || !formData.monthlyRent) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const newUnit = await unitsApi.create(formData);
      setUnits([...units, newUnit]);
      setShowAddDialog(false);
      resetForm();
      toast.success('Unit added successfully');
    } catch (err) {
      toast.error('Failed to add unit');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUnit = async () => {
    if (!editingUnit) return;

    setSaving(true);
    try {
      const updateData: UpdateUnitData = {
        unitNumber: formData.unitNumber,
        floor: formData.floor,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        monthlyRent: formData.monthlyRent,
        paymentDueDay: formData.paymentDueDay,
      };
      const updatedUnit = await unitsApi.update(editingUnit.id, updateData);
      setUnits(units.map(u => u.id === editingUnit.id ? updatedUnit : u));
      setEditingUnit(null);
      resetForm();
      toast.success('Unit updated successfully');
    } catch (err) {
      toast.error('Failed to update unit');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnit) return;

    setSaving(true);
    try {
      await unitsApi.delete(deleteUnit.id);
      setUnits(units.filter(u => u.id !== deleteUnit.id));
      setDeleteUnit(null);
      toast.success('Unit deleted successfully');
    } catch (err) {
      toast.error('Failed to delete unit');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (unit: Unit) => {
    setFormData({
      propertyId: params.id as string,
      unitNumber: unit.unitNumber,
      floor: unit.floor || undefined,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      monthlyRent: unit.monthlyRent,
      paymentDueDay: unit.paymentDueDay,
    });
    setEditingUnit(unit);
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Home className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Property not found</h3>
        <Button asChild>
          <Link href="/dashboard/properties">Back to Properties</Link>
        </Button>
      </div>
    );
  }

  const UnitForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number *</Label>
          <Input
            id="unitNumber"
            placeholder="e.g., A1, 101"
            value={formData.unitNumber}
            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="floor">Floor</Label>
          <Input
            id="floor"
            type="number"
            placeholder="e.g., 1"
            value={formData.floor || ''}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Select
            value={formData.bedrooms?.toString()}
            onValueChange={(value) => setFormData({ ...formData, bedrooms: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Select
            value={formData.bathrooms?.toString()}
            onValueChange={(value) => setFormData({ ...formData, bathrooms: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyRent">Monthly Rent (RWF) *</Label>
          <Input
            id="monthlyRent"
            type="number"
            placeholder="e.g., 150000"
            value={formData.monthlyRent || ''}
            onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentDueDay">Payment Due Day</Label>
          <Select
            value={formData.paymentDueDay?.toString()}
            onValueChange={(value) => setFormData({ ...formData, paymentDueDay: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/properties/${property.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Units</h1>
            <p className="text-muted-foreground">{property.name}</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Units ({units.length})</CardTitle>
          <CardDescription>
            All units in {property.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {units.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Bed/Bath</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Due Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                    <TableCell>{unit.floor || '-'}</TableCell>
                    <TableCell>{unit.bedrooms}/{unit.bathrooms}</TableCell>
                    <TableCell>{formatCurrency(unit.monthlyRent)}</TableCell>
                    <TableCell>{unit.paymentDueDay}</TableCell>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(unit)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUnit(unit)}
                          disabled={unit.status === 'occupied'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                Add units to this property
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
            <DialogDescription>
              Add a new unit to {property.name}
            </DialogDescription>
          </DialogHeader>
          <UnitForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAddUnit} disabled={saving}>
              {saving ? 'Adding...' : 'Add Unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => {
        if (!open) {
          setEditingUnit(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>
              Update unit details
            </DialogDescription>
          </DialogHeader>
          <UnitForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUnit(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditUnit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Dialog */}
      <Dialog open={!!deleteUnit} onOpenChange={() => setDeleteUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete unit &quot;{deleteUnit?.unitNumber}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUnit(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUnit} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
