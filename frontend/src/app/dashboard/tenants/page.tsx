'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreVertical, Users, Pencil, Trash2, Phone, Mail, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTenants();
  }, [statusFilter]);

  const loadTenants = async () => {
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await tenantsApi.getAll(filter);
      setTenants(data);
    } catch (err) {
      toast.error('Failed to load tenants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTenant) return;

    setDeleting(true);
    try {
      await tenantsApi.delete(deleteTenant.id);
      setTenants(tenants.filter(t => t.id !== deleteTenant.id));
      toast.success('Tenant deleted successfully');
      setDeleteTenant(null);
    } catch (err) {
      toast.error('Failed to delete tenant');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'late':
        return <Badge className="bg-red-100 text-red-800">Late</Badge>;
      case 'exited':
        return <Badge className="bg-gray-100 text-gray-800">Exited</Badge>;
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
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your tenants
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="exited">Exited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first tenant
            </p>
            <Button asChild>
              <Link href="/dashboard/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      className="font-medium hover:underline"
                    >
                      {tenant.firstName} {tenant.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {tenant.phone}
                      </div>
                      {tenant.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {tenant.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.unit ? (
                      <div>
                        <p className="font-medium">{tenant.unit.property?.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          Unit {tenant.unit.unitNumber}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.unit ? formatCurrency(tenant.unit.monthlyRent) : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/tenants/${tenant.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTenant(tenant)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTenant} onOpenChange={() => setDeleteTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTenant?.firstName} {deleteTenant?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTenant(null)}
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
