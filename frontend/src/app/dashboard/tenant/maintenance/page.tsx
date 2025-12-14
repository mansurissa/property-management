'use client';

import { useEffect, useState } from 'react';
import { tenantPortalApi, MaintenanceTicket, PaginatedResponse } from '@/lib/api/tenant-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wrench,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function TenantMaintenancePage() {
  const { t, locale } = useLanguage();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New ticket form
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    category: '',
    description: '',
    priority: 'medium'
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadTickets(1);
  }, [statusFilter]);

  const loadTickets = async (page: number) => {
    try {
      setLoading(true);
      const response = await tenantPortalApi.getMaintenanceTickets(page, 10, statusFilter === 'all' ? undefined : statusFilter);
      setTickets(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.category || !newTicket.description) {
      setCreateError(t('tenant.fillRequired'));
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      await tenantPortalApi.createMaintenanceTicket(newTicket);
      setShowNewTicketDialog(false);
      setNewTicket({ category: '', description: '', priority: 'medium' });
      loadTickets(1);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(`${locale}-RW`, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            {t('common.pending')}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1" />
            {t('tenant.inProgress')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('common.completed')}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            {t('tenant.cancelled')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{t('tenant.urgent')}</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">{t('tenant.high')}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">{t('tenant.medium')}</Badge>;
      case 'low':
        return <Badge variant="secondary">{t('tenant.low')}</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing':
        return '🔧';
      case 'electrical':
        return '⚡';
      case 'structural':
        return '🏗️';
      case 'appliance':
        return '🔌';
      default:
        return '🛠️';
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tenant.maintenanceRequests')}</h1>
          <p className="text-muted-foreground">{t('tenant.submitAndTrack')}</p>
        </div>
        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('tenant.newRequest')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('tenant.submitRequest')}</DialogTitle>
              <DialogDescription>
                {t('tenant.describeIssue')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {createError && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {createError}
                </p>
              )}

              <div className="space-y-2">
                <Label>{t('tenant.requestCategory')} *</Label>
                <Select
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('tenant.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">🔧 {t('tenant.plumbing')}</SelectItem>
                    <SelectItem value="electrical">⚡ {t('tenant.electrical')}</SelectItem>
                    <SelectItem value="structural">🏗️ {t('tenant.structural')}</SelectItem>
                    <SelectItem value="appliance">🔌 {t('tenant.appliance')}</SelectItem>
                    <SelectItem value="other">🛠️ {t('tenant.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('tenant.requestPriority')}</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('tenant.low')}</SelectItem>
                    <SelectItem value="medium">{t('tenant.medium')}</SelectItem>
                    <SelectItem value="high">{t('tenant.high')}</SelectItem>
                    <SelectItem value="urgent">{t('tenant.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('tenant.requestDescription')} *</Label>
                <Textarea
                  placeholder={t('tenant.describeInDetail')}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateTicket} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('tenant.submitting')}
                  </>
                ) : (
                  t('tenant.submitRequest')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('tenant.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('tenant.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('common.pending')}</SelectItem>
            <SelectItem value="in_progress">{t('tenant.inProgress')}</SelectItem>
            <SelectItem value="completed">{t('common.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('tenant.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('tenant.maintenanceTickets')}
          </CardTitle>
          <CardDescription>
            {pagination.total} {pagination.total === 1 ? t('tenant.ticketFound') : t('tenant.ticketsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-destructive py-8">{error}</p>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('tenant.noMaintenanceTickets')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('tenant.clickNewRequest')}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                          <span className="font-medium capitalize">{ticket.category}</span>
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{t('tenant.created')}: {formatDate(ticket.createdAt)}</span>
                          {ticket.assignee && (
                            <span>
                              {t('tenant.assignedTo')}: {ticket.assignee.firstName} {ticket.assignee.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTickets(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('common.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTickets(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      {t('common.next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
