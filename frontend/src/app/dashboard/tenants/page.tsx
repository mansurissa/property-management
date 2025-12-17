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
import { Plus, MoreVertical, Users, Pencil, Trash2, Phone, Mail, Home, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Input } from '@/components/ui/input';
import { exportToExcel, formatCurrency as formatCurrencyForExport, formatDateForExport } from '@/lib/utils/export';

export default function TenantsPage() {
  const { t, locale } = useLanguage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
      toast.error(t('owner.failedToLoadTenants'));
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
      toast.success(t('owner.tenantDeletedSuccess'));
      setDeleteTenant(null);
    } catch (err) {
      toast.error(t('owner.failedToDeleteTenant'));
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('common.active')}</Badge>;
      case 'late':
        return <Badge className="bg-red-100 text-red-800">{t('owner.late')}</Badge>;
      case 'exited':
        return <Badge className="bg-gray-100 text-gray-800">{t('owner.exited')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(`${locale}-RW`, {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Filter tenants based on search query
  const filteredTenants = tenants.filter((tenant) => {
    const searchLower = searchQuery.toLowerCase();
    return searchQuery === '' ||
      tenant.firstName.toLowerCase().includes(searchLower) ||
      tenant.lastName.toLowerCase().includes(searchLower) ||
      tenant.email?.toLowerCase().includes(searchLower) ||
      tenant.phone.toLowerCase().includes(searchLower) ||
      tenant.unit?.unitNumber.toLowerCase().includes(searchLower) ||
      tenant.unit?.property?.name.toLowerCase().includes(searchLower);
  });

  const handleExportToExcel = () => {
    const exportData = filteredTenants.map(tenant => ({
      'First Name': tenant.firstName,
      'Last Name': tenant.lastName,
      'Phone': tenant.phone,
      'Email': tenant.email || '',
      'National ID': tenant.nationalId || '',
      'Property': tenant.unit?.property?.name || 'N/A',
      'Unit': tenant.unit?.unitNumber || 'N/A',
      'Monthly Rent': tenant.unit ? formatCurrencyForExport(tenant.unit.monthlyRent) : 'N/A',
      'Lease Start': tenant.leaseStartDate ? formatDateForExport(tenant.leaseStartDate) : '',
      'Lease End': tenant.leaseEndDate ? formatDateForExport(tenant.leaseEndDate) : '',
      'Status': tenant.status,
      'Emergency Contact': tenant.emergencyContact || '',
      'Emergency Phone': tenant.emergencyPhone || ''
    }));

    const statusText = statusFilter !== 'all' ? `_${statusFilter}` : '';
    const filename = `tenants${statusText}_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, filename, 'Tenants');
    toast.success('Tenants exported to Excel successfully');
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
          <h1 className="text-3xl font-bold">{t('owner.tenants')}</h1>
          <p className="text-muted-foreground">
            {t('owner.manageTenants')}
          </p>
        </div>
        <div className="flex gap-2">
          {tenants.length > 0 && (
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          )}
          <Button asChild>
            <Link href="/dashboard/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('owner.addTenant')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants by name, email, phone, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('owner.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('owner.allTenants')}</SelectItem>
            <SelectItem value="active">{t('common.active')}</SelectItem>
            <SelectItem value="late">{t('owner.late')}</SelectItem>
            <SelectItem value="exited">{t('owner.exited')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('owner.noTenantsYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('owner.getStartedAddTenant')}
            </p>
            <Button asChild>
              <Link href="/dashboard/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('owner.addTenant')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('owner.name')}</TableHead>
                <TableHead>{t('owner.contact')}</TableHead>
                <TableHead>{t('owner.propertyUnit')}</TableHead>
                <TableHead>{t('owner.rent')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
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
                          {t('owner.unit')} {tenant.unit.unitNumber}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{t('owner.notAssigned')}</span>
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
                            {t('owner.viewDetails')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTenant(tenant)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
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
            <DialogTitle>{t('owner.deleteTenant')}</DialogTitle>
            <DialogDescription>
              {t('owner.deleteTenantConfirm')} {deleteTenant?.firstName} {deleteTenant?.lastName}? {t('owner.deleteTenantWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTenant(null)}
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
