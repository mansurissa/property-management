'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tenantsApi, Tenant, UpdateTenantData } from '@/lib/api/tenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateTenantData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'active',
    leaseStartDate: '',
    leaseEndDate: '',
  });

  useEffect(() => {
    if (params.id) {
      loadTenant(params.id as string);
    }
  }, [params.id]);

  const loadTenant = async (id: string) => {
    try {
      const tenant = await tenantsApi.getById(id);
      setFormData({
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email || '',
        phone: tenant.phone,
        nationalId: tenant.nationalId || '',
        emergencyContact: tenant.emergencyContact || '',
        emergencyPhone: tenant.emergencyPhone || '',
        status: tenant.status,
        leaseStartDate: tenant.leaseStartDate || '',
        leaseEndDate: tenant.leaseEndDate || '',
      });
    } catch (err) {
      toast.error('Failed to load tenant');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await tenantsApi.update(params.id as string, formData);
      toast.success('Tenant updated successfully');
      router.push(`/dashboard/tenants/${params.id}`);
    } catch (err) {
      toast.error('Failed to update tenant');
      console.error(err);
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/tenants/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Tenant</h1>
          <p className="text-muted-foreground">
            Update tenant information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update the tenant&apos;s personal details
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID</Label>
                <Input
                  id="nationalId"
                  placeholder="Rwanda National ID"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'late' | 'exited') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="exited">Exited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <CardTitle>Lease Information</CardTitle>
            <CardDescription>
              Update lease dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/tenants/${params.id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
