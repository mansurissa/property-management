'use client';

import { useEffect, useState } from 'react';
import { agentPortalApi, Owner, Property, TenantSearchResult } from '@/lib/api/agent-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Search,
  Plus,
  User,
  Home,
  CreditCard,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AssistOwnerPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<TenantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [commissionEarned, setCommissionEarned] = useState<number | null>(null);

  // Form states
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    city: '',
    type: 'apartment'
  });

  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [tenantForm, setTenantForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    leaseStart: '',
    leaseEnd: '',
    rentAmount: 0
  });

  const [selectedTenant, setSelectedTenant] = useState<TenantSearchResult | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    notes: ''
  });

  const searchOwners = async () => {
    try {
      setLoading(true);
      const data = await agentPortalApi.searchOwners(searchQuery);
      setOwners(data);
    } catch (err: any) {
      console.error('Failed to search owners:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectOwner = async (owner: Owner) => {
    setSelectedOwner(owner);
    try {
      setLoading(true);
      const [propertiesData, tenantsData] = await Promise.all([
        agentPortalApi.getOwnerProperties(owner.id),
        agentPortalApi.getOwnerTenants(owner.id)
      ]);
      setProperties(propertiesData);
      setTenants(tenantsData);
    } catch (err: any) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async () => {
    if (!selectedOwner) return;

    try {
      setIsProcessing(true);
      const result = await agentPortalApi.createPropertyForOwner({
        ownerId: selectedOwner.id,
        ...propertyForm
      });

      setShowPropertyDialog(false);
      setSuccessMessage('Property registered successfully!');
      if (result.commission) {
        setCommissionEarned(result.commission.amount);
      }

      // Refresh properties
      const propertiesData = await agentPortalApi.getOwnerProperties(selectedOwner.id);
      setProperties(propertiesData);

      // Reset form
      setPropertyForm({ name: '', address: '', city: '', type: 'apartment' });
    } catch (err: any) {
      alert(err.message || 'Failed to create property');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTenant = async () => {
    if (!selectedOwner || !selectedUnit) return;

    try {
      setIsProcessing(true);
      const result = await agentPortalApi.addTenantForOwner({
        ownerId: selectedOwner.id,
        unitId: selectedUnit,
        ...tenantForm
      });

      setShowTenantDialog(false);
      setSuccessMessage('Tenant added successfully!');
      if (result.commission) {
        setCommissionEarned(result.commission.amount);
      }

      // Refresh data
      const [propertiesData, tenantsData] = await Promise.all([
        agentPortalApi.getOwnerProperties(selectedOwner.id),
        agentPortalApi.getOwnerTenants(selectedOwner.id)
      ]);
      setProperties(propertiesData);
      setTenants(tenantsData);

      // Reset form
      setSelectedUnit('');
      setTenantForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationalId: '',
        leaseStart: '',
        leaseEnd: '',
        rentAmount: 0
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add tenant');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedOwner || !selectedTenant || !selectedTenant.unit) return;

    try {
      setIsProcessing(true);
      const result = await agentPortalApi.recordPaymentForOwner({
        ownerId: selectedOwner.id,
        tenantId: selectedTenant.id,
        unitId: selectedTenant.unit.id,
        ...paymentForm
      });

      setShowPaymentDialog(false);
      setSuccessMessage('Payment recorded successfully!');
      if (result.commission) {
        setCommissionEarned(result.commission.amount);
      }

      // Reset form
      setSelectedTenant(null);
      setPaymentForm({
        amount: 0,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
        notes: ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get all vacant units across properties
  const vacantUnits = properties.flatMap(p =>
    (p.units || [])
      .filter(u => u.status === 'vacant')
      .map(u => ({ ...u, propertyName: p.name, propertyId: p.id }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Assist Property Owner</h1>
          <p className="text-muted-foreground">
            Help owners register properties, add tenants, and record payments
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{successMessage}</p>
              {commissionEarned && (
                <p className="text-sm text-green-600">
                  Commission earned: {formatCurrency(commissionEarned)}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSuccessMessage('');
              setCommissionEarned(null);
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Owner Search */}
      {!selectedOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Find Property Owner</CardTitle>
            <CardDescription>
              Search for the owner you want to assist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchOwners()}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={searchOwners} disabled={loading}>
                Search
              </Button>
            </div>

            {loading && (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            )}

            {!loading && owners.length > 0 && (
              <div className="mt-4 space-y-2">
                {owners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectOwner(owner)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                        <p className="text-sm text-muted-foreground">{owner.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery && owners.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No owners found matching your search
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Owner Selected - Show Actions */}
      {selectedOwner && (
        <>
          {/* Selected Owner Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedOwner.firstName} {selectedOwner.lastName}
                    </p>
                    <p className="text-muted-foreground">{selectedOwner.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedOwner.phone}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOwner(null);
                    setProperties([]);
                    setTenants([]);
                  }}
                >
                  Change Owner
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Register Property */}
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setShowPropertyDialog(true)}>
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Register Property</h3>
                <p className="text-sm text-muted-foreground">
                  Add a new property for this owner
                </p>
              </CardContent>
            </Card>

            {/* Add Tenant */}
            <Card
              className={`border-2 transition-colors ${vacantUnits.length > 0 ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'}`}
              onClick={() => vacantUnits.length > 0 && setShowTenantDialog(true)}
            >
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <Home className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Add Tenant</h3>
                <p className="text-sm text-muted-foreground">
                  {vacantUnits.length > 0
                    ? `${vacantUnits.length} vacant units available`
                    : 'No vacant units available'}
                </p>
              </CardContent>
            </Card>

            {/* Record Payment */}
            <Card
              className={`border-2 transition-colors ${tenants.length > 0 ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'}`}
              onClick={() => tenants.length > 0 && setShowPaymentDialog(true)}
            >
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-4">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Record Payment</h3>
                <p className="text-sm text-muted-foreground">
                  {tenants.length > 0
                    ? `${tenants.length} tenants`
                    : 'No tenants to record payment for'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Owner's Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Properties ({properties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  This owner has no properties yet
                </p>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{property.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {property.address}, {property.city}
                          </p>
                        </div>
                        <Badge>{property.type}</Badge>
                      </div>
                      {property.units && property.units.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {property.units.map((unit) => (
                            <Badge
                              key={unit.id}
                              variant={unit.status === 'vacant' ? 'outline' : 'secondary'}
                            >
                              {unit.unitNumber} - {unit.status}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Property Dialog */}
      <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Property</DialogTitle>
            <DialogDescription>
              Add a property for {selectedOwner?.firstName} {selectedOwner?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                placeholder="e.g., Sunset Apartments"
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                placeholder="e.g., KG 123 Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                  placeholder="e.g., Kigali"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={propertyForm.type}
                  onValueChange={(v) => setPropertyForm({ ...propertyForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPropertyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProperty}
              disabled={isProcessing || !propertyForm.name || !propertyForm.address || !propertyForm.city}
            >
              {isProcessing ? 'Creating...' : 'Create Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Dialog */}
      <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>
              Add a tenant for {selectedOwner?.firstName} {selectedOwner?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Select Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vacant unit" />
                </SelectTrigger>
                <SelectContent>
                  {vacantUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.propertyName} - Unit {unit.unitNumber} ({formatCurrency(unit.monthlyRent)}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={tenantForm.firstName}
                  onChange={(e) => setTenantForm({ ...tenantForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={tenantForm.lastName}
                  onChange={(e) => setTenantForm({ ...tenantForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={tenantForm.email}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input
                  value={tenantForm.nationalId}
                  onChange={(e) => setTenantForm({ ...tenantForm, nationalId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lease Start</Label>
                <Input
                  type="date"
                  value={tenantForm.leaseStart}
                  onChange={(e) => setTenantForm({ ...tenantForm, leaseStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lease End</Label>
                <Input
                  type="date"
                  value={tenantForm.leaseEnd}
                  onChange={(e) => setTenantForm({ ...tenantForm, leaseEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monthly Rent (RWF)</Label>
              <Input
                type="number"
                value={tenantForm.rentAmount}
                onChange={(e) => setTenantForm({ ...tenantForm, rentAmount: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTenantDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTenant}
              disabled={isProcessing || !selectedUnit || !tenantForm.firstName || !tenantForm.lastName || !tenantForm.email}
            >
              {isProcessing ? 'Adding...' : 'Add Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a rent payment for a tenant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Tenant</Label>
              <Select
                value={selectedTenant?.id || ''}
                onValueChange={(v) => {
                  const tenant = tenants.find(t => t.id === v);
                  setSelectedTenant(tenant || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.firstName} {tenant.lastName}
                      {tenant.unit && ` - Unit ${tenant.unit.unitNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (RWF)</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Month</Label>
                <Select
                  value={paymentForm.periodMonth.toString()}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, periodMonth: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period Year</Label>
                <Input
                  type="number"
                  value={paymentForm.periodYear}
                  onChange={(e) => setPaymentForm({ ...paymentForm, periodYear: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isProcessing || !selectedTenant || paymentForm.amount <= 0}
            >
              {isProcessing ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
