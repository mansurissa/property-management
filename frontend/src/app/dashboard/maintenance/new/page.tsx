'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { maintenanceApi, CreateMaintenanceData } from '@/lib/api/maintenance';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Unit } from '@/lib/api/properties';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'structural', label: 'Structural' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'other', label: 'Other' },
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function NewMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState<CreateMaintenanceData>({
    unitId: '',
    tenantId: undefined,
    category: 'other',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    loadProperties();
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty);
      setAvailableUnits(property?.units || []);
      setFormData(prev => ({ ...prev, unitId: '', tenantId: undefined }));
    }
  }, [selectedProperty, properties]);

  useEffect(() => {
    if (formData.unitId) {
      const unit = availableUnits.find(u => u.id === formData.unitId);
      if (unit?.tenant) {
        setFormData(prev => ({ ...prev, tenantId: unit.tenant?.id }));
      }
    }
  }, [formData.unitId, availableUnits]);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (err) {
      toast.error('Failed to load properties');
      console.error(err);
    }
  };

  const loadTenants = async () => {
    try {
      const data = await tenantsApi.getAll('active');
      setTenants(data);
    } catch (err) {
      toast.error('Failed to load tenants');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unitId || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await maintenanceApi.create(formData);
      toast.success('Maintenance ticket created successfully');
      router.push('/dashboard/maintenance');
    } catch (err) {
      toast.error('Failed to create ticket');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/maintenance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Maintenance Ticket</h1>
          <p className="text-muted-foreground">
            Report a maintenance issue
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Select the property and unit with the issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property *</Label>
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
                <Label>Unit *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  disabled={!selectedProperty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProperty ? "Select unit" : "Select property first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                        {unit.tenant && ` - ${unit.tenant.firstName} ${unit.tenant.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Describe the maintenance issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        {pri.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the maintenance issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Ticket'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/maintenance">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
