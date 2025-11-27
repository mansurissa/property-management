'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { maintenanceApi, MaintenanceTicket, MaintenanceFilters } from '@/lib/api/maintenance';
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
import { Label } from '@/components/ui/label';
import { Plus, MoreVertical, Wrench, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MaintenanceFilters>({
    status: undefined,
    priority: undefined,
  });
  const [deleteTicket, setDeleteTicket] = useState<MaintenanceTicket | null>(null);
  const [updateTicket, setUpdateTicket] = useState<MaintenanceTicket | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    try {
      const data = await maintenanceApi.getAll(filters);
      setTickets(data);
    } catch (err) {
      toast.error('Failed to load maintenance tickets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTicket) return;

    setProcessing(true);
    try {
      await maintenanceApi.delete(deleteTicket.id);
      setTickets(tickets.filter(t => t.id !== deleteTicket.id));
      toast.success('Ticket deleted successfully');
      setDeleteTicket(null);
    } catch (err) {
      toast.error('Failed to delete ticket');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateTicket || !newStatus) return;

    setProcessing(true);
    try {
      const updated = await maintenanceApi.update(updateTicket.id, { status: newStatus as any });
      setTickets(tickets.map(t => t.id === updateTicket.id ? updated : t));
      toast.success('Status updated successfully');
      setUpdateTicket(null);
      setNewStatus('');
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      structural: 'Structural',
      appliance: 'Appliance',
      other: 'Other'
    };
    return labels[category] || category;
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
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">
            Manage maintenance tickets
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters({
              ...filters,
              status: value === 'all' ? undefined : value
            })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={filters.priority || 'all'}
            onValueChange={(value) => setFilters({
              ...filters,
              priority: value === 'all' ? undefined : value
            })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.status || filters.priority
                ? 'No tickets match the selected filters'
                : 'No maintenance tickets yet'}
            </p>
            <Button asChild>
              <Link href="/dashboard/maintenance/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                  <TableCell>
                    {ticket.unit ? (
                      <div>
                        <p className="font-medium">{ticket.unit.property?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Unit {ticket.unit.unitNumber}
                        </p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {ticket.description}
                  </TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setUpdateTicket(ticket);
                          setNewStatus(ticket.status);
                        }}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTicket(ticket)}
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

      {/* Update Status Dialog */}
      <Dialog open={!!updateTicket} onOpenChange={() => setUpdateTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change the status of this maintenance ticket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateTicket(null)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={processing}>
              {processing ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTicket} onOpenChange={() => setDeleteTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this maintenance ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTicket(null)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
