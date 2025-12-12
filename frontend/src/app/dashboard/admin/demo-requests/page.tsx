'use client';

import { useEffect, useState } from 'react';
import { demoRequestsApi, DemoRequest, DemoRequestStats } from '@/lib/api/demo-requests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Play,
  Clock,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  Trash2,
  RefreshCw,
  Users
} from 'lucide-react';

export default function DemoRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [stats, setStats] = useState<DemoRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updateData, setUpdateData] = useState({ status: '', notes: '', scheduledAt: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const [requestsData, statsData] = await Promise.all([
        demoRequestsApi.getAll(params),
        demoRequestsApi.getStats()
      ]);

      setRequests(requestsData.data);
      setPagination({
        total: requestsData.meta.total,
        page: requestsData.meta.page,
        totalPages: requestsData.meta.totalPages
      });
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load demo requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await demoRequestsApi.update(selectedRequest.id, {
        status: updateData.status || undefined,
        notes: updateData.notes || undefined,
        scheduledAt: updateData.scheduledAt || undefined
      });
      setShowUpdateDialog(false);
      setSelectedRequest(null);
      setUpdateData({ status: '', notes: '', scheduledAt: '' });
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to update demo request');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await demoRequestsApi.delete(selectedRequest.id);
      setShowDeleteDialog(false);
      setSelectedRequest(null);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to delete demo request');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'contacted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Phone className="h-3 w-3 mr-1" />Contacted</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openUpdateDialog = (request: DemoRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      notes: request.notes || '',
      scheduledAt: request.scheduledAt ? new Date(request.scheduledAt).toISOString().slice(0, 16) : ''
    });
    setShowUpdateDialog(true);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Play className="h-8 w-8" />
            Demo Requests
          </h1>
          <p className="text-muted-foreground">
            Manage and respond to demo requests from potential customers
          </p>
        </div>
        <Button variant="outline" onClick={() => loadData(pagination.page)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <p className="text-xs text-yellow-600">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700">{stats.contacted}</div>
              <p className="text-xs text-blue-600">Contacted</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-700">{stats.scheduled}</div>
              <p className="text-xs text-purple-600">Scheduled</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
              <p className="text-xs text-green-600">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-700">{stats.cancelled}</div>
              <p className="text-xs text-red-600">Cancelled</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{stats.recentCount}</div>
              <p className="text-xs text-primary/70">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demo Requests ({pagination.total})
          </CardTitle>
          <CardDescription>
            Click on a request to view details and update status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Play className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Demo Requests</h3>
              <p className="text-muted-foreground text-center">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} requests found`
                  : 'No demo requests have been submitted yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.fullName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.companyName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {request.numberOfProperties || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openUpdateDialog(request)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => loadData(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => loadData(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Demo Request Details</DialogTitle>
            <DialogDescription>
              View the full details of this demo request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedRequest.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
                {selectedRequest.companyName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{selectedRequest.companyName}</p>
                  </div>
                )}
                {selectedRequest.numberOfProperties && (
                  <div>
                    <p className="text-sm text-muted-foreground">Properties</p>
                    <p className="font-medium">{selectedRequest.numberOfProperties}</p>
                  </div>
                )}
              </div>

              {selectedRequest.message && (
                <div>
                  <p className="text-sm text-muted-foreground">Message</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.message}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Internal Notes</p>
                  <p className="text-sm bg-blue-50 text-blue-700 p-3 rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {selectedRequest.scheduledAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Demo</p>
                  <p className="font-medium">{formatDate(selectedRequest.scheduledAt)}</p>
                </div>
              )}

              {selectedRequest.contactedByUser && (
                <div>
                  <p className="text-sm text-muted-foreground">Contacted By</p>
                  <p className="font-medium">
                    {selectedRequest.contactedByUser.firstName} {selectedRequest.contactedByUser.lastName}
                  </p>
                  {selectedRequest.contactedAt && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedRequest.contactedAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Submitted: {formatDate(selectedRequest.createdAt)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailDialog(false);
              if (selectedRequest) openUpdateDialog(selectedRequest);
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Demo Request</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this demo request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={updateData.status}
                onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {updateData.status === 'scheduled' && (
              <div className="space-y-2">
                <Label>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={updateData.scheduledAt}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                placeholder="Add notes about this request..."
                value={updateData.notes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Demo Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this demo request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedRequest.fullName}</p>
              <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
