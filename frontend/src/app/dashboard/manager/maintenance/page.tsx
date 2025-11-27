'use client';

import { useEffect, useState } from 'react';
import { managerPortalApi, ManagerProperty, ManagerMaintenanceTicket } from '@/lib/api/manager-portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wrench, Building2, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function ManagerMaintenancePage() {
  const [properties, setProperties] = useState<ManagerProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [tickets, setTickets] = useState<ManagerMaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketsError, setTicketsError] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadTickets(selectedPropertyId);
    } else {
      setTickets([]);
    }
  }, [selectedPropertyId]);

  const loadProperties = async () => {
    try {
      const data = await managerPortalApi.getProperties();
      // Filter to only properties where manager can view maintenance
      const propertiesWithMaintenanceAccess = data.filter(p => p.permissions.canViewMaintenance);
      setProperties(propertiesWithMaintenanceAccess);
      if (propertiesWithMaintenanceAccess.length > 0) {
        setSelectedPropertyId(propertiesWithMaintenanceAccess[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (propertyId: string) => {
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const data = await managerPortalApi.getPropertyMaintenance(propertyId);
      setTickets(data);
    } catch (err: any) {
      setTicketsError(err.message || 'Failed to load maintenance tickets');
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      hvac: 'HVAC',
      appliance: 'Appliance',
      structural: 'Structural',
      pest_control: 'Pest Control',
      cleaning: 'Cleaning',
      other: 'Other'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">View maintenance tickets from your assigned properties</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Maintenance Access</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have permission to view maintenance tickets for any of your assigned properties. Contact the property owner to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const completedTickets = tickets.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maintenance</h1>
        <p className="text-muted-foreground">View maintenance tickets from your assigned properties</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Property:</span>
        </div>
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {tickets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tickets</CardDescription>
              <CardTitle className="text-2xl">{tickets.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Open
              </CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{openTickets}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Wrench className="h-3 w-3" /> In Progress
              </CardDescription>
              <CardTitle className="text-2xl text-blue-600">{inProgressTickets}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">{completedTickets}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {ticketsLoading ? (
        <Skeleton className="h-64" />
      ) : ticketsError ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">{ticketsError}</p>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Maintenance Tickets</h3>
            <p className="text-muted-foreground text-center">
              No maintenance tickets found for this property.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Tickets
            </CardTitle>
            <CardDescription>
              All maintenance requests for this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.unit ? `Unit ${ticket.unit.unitNumber}` : 'N/A'}
                    </TableCell>
                    <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>
                      {ticket.assignedStaff
                        ? `${ticket.assignedStaff.firstName} ${ticket.assignedStaff.lastName}`
                        : <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
