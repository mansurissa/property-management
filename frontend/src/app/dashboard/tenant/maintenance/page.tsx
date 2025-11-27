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
      setCreateError('Please fill in all required fields');
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
    return new Date(dateString).toLocaleDateString('en-RW', {
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
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
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
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground">Submit and track maintenance tickets</p>
        </div>
        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Maintenance Request</DialogTitle>
              <DialogDescription>
                Describe the issue and we'll get it fixed as soon as possible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {createError && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {createError}
                </p>
              )}

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">🔧 Plumbing</SelectItem>
                    <SelectItem value="electrical">⚡ Electrical</SelectItem>
                    <SelectItem value="structural">🏗️ Structural</SelectItem>
                    <SelectItem value="appliance">🔌 Appliance</SelectItem>
                    <SelectItem value="other">🛠️ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
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

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the issue in detail..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
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
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Tickets
          </CardTitle>
          <CardDescription>
            {pagination.total} ticket{pagination.total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-destructive py-8">{error}</p>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No maintenance tickets found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "New Request" to submit a maintenance request
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
                          <span>Created: {formatDate(ticket.createdAt)}</span>
                          {ticket.assignee && (
                            <span>
                              Assigned to: {ticket.assignee.firstName} {ticket.assignee.lastName}
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
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTickets(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTickets(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      Next
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
