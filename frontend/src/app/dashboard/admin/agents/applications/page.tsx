'use client';

import { useEffect, useState } from 'react';
import { adminAgentsApi, AgentApplication } from '@/lib/api/admin-agents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Copy,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function AgentApplicationsPage() {
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApprovalResult, setShowApprovalResult] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalResult, setApprovalResult] = useState<{
    temporaryPassword: string;
    user: { email: string; firstName: string; lastName: string };
  } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await adminAgentsApi.getApplications(params);
      setApplications(data.applications);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: AgentApplication) => {
    try {
      setProcessingId(application.id);
      const result = await adminAgentsApi.approveApplication(application.id);
      setApprovalResult({
        temporaryPassword: result.temporaryPassword,
        user: result.user
      });
      setShowApprovalResult(true);
      loadApplications(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    try {
      setProcessingId(selectedApplication.id);
      await adminAgentsApi.rejectApplication(selectedApplication.id, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedApplication(null);
      loadApplications(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/agents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Agent Applications</h1>
            <p className="text-muted-foreground">
              Review and process agent applications
            </p>
          </div>
        </div>
      </div>

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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Applications ({pagination.total})
          </CardTitle>
          <CardDescription>
            Review agent applications and approve or reject them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Applications</h3>
              <p className="text-muted-foreground text-center">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} applications found`
                  : 'No applications have been submitted yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {app.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{app.phone}</TableCell>
                      <TableCell>{app.city || '-'}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{formatDate(app.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={processingId === app.id}
                                onClick={() => handleApprove(app)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={processingId === app.id}
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => loadApplications(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => loadApplications(pagination.page + 1)}
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

      {/* Application Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the applicant's information
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedApplication.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">National ID</p>
                  <p className="font-medium">{selectedApplication.nationalId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedApplication.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              {selectedApplication.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedApplication.address}</p>
                </div>
              )}

              {selectedApplication.motivation && (
                <div>
                  <p className="text-sm text-muted-foreground">Motivation</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedApplication.motivation}</p>
                </div>
              )}

              {selectedApplication.experience && (
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedApplication.experience}</p>
                </div>
              )}

              {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                <div>
                  <p className="text-sm text-muted-foreground">Rejection Reason</p>
                  <p className="text-sm bg-red-50 text-red-700 p-3 rounded-lg">
                    {selectedApplication.rejectionReason}
                  </p>
                </div>
              )}

              {selectedApplication.reviewer && (
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed By</p>
                  <p className="font-medium">
                    {selectedApplication.reviewer.firstName} {selectedApplication.reviewer.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.reviewedAt && formatDate(selectedApplication.reviewedAt)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedApplication?.status === 'pending' && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailDialog(false);
                    setShowRejectDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleApprove(selectedApplication);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this application (optional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!processingId}>
              {processingId ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Result Dialog */}
      <Dialog open={showApprovalResult} onOpenChange={setShowApprovalResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Application Approved
            </DialogTitle>
            <DialogDescription>
              The agent account has been created successfully
            </DialogDescription>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Agent: {approvalResult.user.firstName} {approvalResult.user.lastName}
                </p>
                <p className="text-sm text-green-700">
                  Email: {approvalResult.user.email}
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Temporary Password
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white rounded border font-mono text-sm">
                    {approvalResult.temporaryPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(approvalResult.temporaryPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  Share this password with the agent. They will be required to change it on first login.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowApprovalResult(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
