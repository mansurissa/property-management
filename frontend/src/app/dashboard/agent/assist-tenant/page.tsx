'use client';

import { useEffect, useState } from 'react';
import { agentPortalApi, TenantSearchResult } from '@/lib/api/agent-portal';
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
  Search,
  User,
  CreditCard,
  Wrench,
  Edit2,
  CheckCircle,
  ArrowLeft,
  Home,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function AssistTenantPage() {
  const [tenants, setTenants] = useState<TenantSearchResult[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [commissionEarned, setCommissionEarned] = useState<number | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    phone: '',
    email: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  const searchTenants = async () => {
    try {
      setLoading(true);
      const data = await agentPortalApi.searchTenants(searchQuery);
      setTenants(data);
    } catch (err: any) {
      console.error('Failed to search tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = (tenant: TenantSearchResult) => {
    setSelectedTenant(tenant);
    setEditForm({
      phone: tenant.phone || '',
      email: tenant.email || ''
    });
  };

  const handleUpdateInfo = async () => {
    if (!selectedTenant) return;

    try {
      setIsProcessing(true);
      await agentPortalApi.updateTenantInfo(selectedTenant.id, editForm);

      setShowEditDialog(false);
      setSuccessMessage('Tenant information updated successfully!');

      // Update local state
      setSelectedTenant({
        ...selectedTenant,
        phone: editForm.phone,
        email: editForm.email
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update tenant info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedTenant) return;

    try {
      setIsProcessing(true);
      const result = await agentPortalApi.recordPaymentForTenant(selectedTenant.id, paymentForm);

      setShowPaymentDialog(false);
      setSuccessMessage('Payment recorded successfully!');
      if (result.commission) {
        setCommissionEarned(result.commission.amount);
      }

      // Reset form
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

  const handleSubmitMaintenance = async () => {
    if (!selectedTenant) return;

    try {
      setIsProcessing(true);
      const result = await agentPortalApi.submitMaintenanceForTenant(selectedTenant.id, maintenanceForm);

      setShowMaintenanceDialog(false);
      setSuccessMessage('Maintenance request submitted successfully!');
      if (result.commission) {
        setCommissionEarned(result.commission.amount);
      }

      // Reset form
      setMaintenanceForm({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to submit maintenance request');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
          <h1 className="text-3xl font-bold">Assist Tenant</h1>
          <p className="text-muted-foreground">
            Help tenants update info, record payments, and submit maintenance requests
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

      {/* Tenant Search */}
      {!selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Find Tenant</CardTitle>
            <CardDescription>
              Search for the tenant you want to assist
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
                    onKeyDown={(e) => e.key === 'Enter' && searchTenants()}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={searchTenants} disabled={loading}>
                Search
              </Button>
            </div>

            {loading && (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            )}

            {!loading && tenants.length > 0 && (
              <div className="mt-4 space-y-2">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectTenant(tenant)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tenant.firstName} {tenant.lastName}</p>
                          {getStatusBadge(tenant.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{tenant.email}</p>
                        {tenant.unit && (
                          <p className="text-xs text-muted-foreground">
                            {tenant.unit.property?.name} - Unit {tenant.unit.unitNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery && tenants.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tenants found matching your search
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tenant Selected - Show Actions */}
      {selectedTenant && (
        <>
          {/* Selected Tenant Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">
                        {selectedTenant.firstName} {selectedTenant.lastName}
                      </p>
                      {getStatusBadge(selectedTenant.status)}
                    </div>
                    <p className="text-muted-foreground">{selectedTenant.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedTenant.phone}</p>
                    {selectedTenant.unit && (
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedTenant.unit.property?.name} - Unit {selectedTenant.unit.unitNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTenant(null);
                  }}
                >
                  Change Tenant
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Update Info */}
            <Card
              className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setShowEditDialog(true)}
            >
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Edit2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Update Info</h3>
                <p className="text-sm text-muted-foreground">
                  Update tenant's contact information
                </p>
              </CardContent>
            </Card>

            {/* Record Payment */}
            <Card
              className={`border-2 transition-colors ${selectedTenant.unit ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'}`}
              onClick={() => selectedTenant.unit && setShowPaymentDialog(true)}
            >
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Record Payment</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTenant.unit
                    ? 'Record a rent payment for this tenant'
                    : 'Tenant has no assigned unit'}
                </p>
              </CardContent>
            </Card>

            {/* Submit Maintenance */}
            <Card
              className={`border-2 transition-colors ${selectedTenant.unit ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'}`}
              onClick={() => selectedTenant.unit && setShowMaintenanceDialog(true)}
            >
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-4">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Maintenance Request</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTenant.unit
                    ? 'Submit a maintenance request'
                    : 'Tenant has no assigned unit'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Unit Info */}
          {selectedTenant.unit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Current Unit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-medium">{selectedTenant.unit.property?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Number</p>
                    <p className="font-medium">{selectedTenant.unit.unitNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{selectedTenant.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tenant Information</DialogTitle>
            <DialogDescription>
              Update contact details for {selectedTenant?.firstName} {selectedTenant?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInfo} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Info'}
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
              Record a rent payment for {selectedTenant?.firstName} {selectedTenant?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
            <Button onClick={handleRecordPayment} disabled={isProcessing || paymentForm.amount <= 0}>
              {isProcessing ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
            <DialogDescription>
              Submit a maintenance request for {selectedTenant?.firstName} {selectedTenant?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={maintenanceForm.title}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                placeholder="e.g., Leaking faucet in bathroom"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={maintenanceForm.category}
                  onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={maintenanceForm.priority}
                  onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitMaintenance}
              disabled={isProcessing || !maintenanceForm.title || !maintenanceForm.description}
            >
              {isProcessing ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
