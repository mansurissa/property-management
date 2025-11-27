'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tenantsApi, CreateTenantData } from '@/lib/api/tenants';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Unit } from '@/lib/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState<CreateTenantData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    emergencyContact: '',
    emergencyPhone: '',
    unitId: undefined,
    leaseStartDate: '',
    leaseEndDate: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty);
      const vacantUnits = property?.units?.filter(u => u.status === 'vacant') || [];
      setAvailableUnits(vacantUnits);
      setFormData(prev => ({ ...prev, unitId: undefined }));
    } else {
      setAvailableUnits([]);
    }
  }, [selectedProperty, properties]);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (err) {
      toast.error('Failed to load properties');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await tenantsApi.create(formData);
      toast.success('Tenant created successfully');
      router.push('/dashboard/tenants');
    } catch (err) {
      toast.error('Failed to create tenant');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Tenant</h1>
          <p className="text-muted-foreground">
            Create a new tenant
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Enter the tenant&apos;s personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="e.g., 0788123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                placeholder="Rwanda National ID"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>
              Emergency contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contact Name</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Contact name"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="e.g., 0788123456"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unit Assignment</CardTitle>
            <CardDescription>
              Assign the tenant to a unit (optional - can be done later)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
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
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unitId || ''}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value || undefined })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaseStartDate">Lease Start Date</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={formData.leaseStartDate}
                  onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={formData.leaseEndDate}
                  onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Tenant'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/tenants">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
