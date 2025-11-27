'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Users,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';

interface Agency {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    properties: number;
    users: number;
  };
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ agencies: Agency[] }>('/api/admin/agencies');
      setAgencies(response.agencies || []);
    } catch (err: any) {
      console.error('Failed to load agencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = async () => {
    try {
      setIsProcessing(true);
      await apiClient.post('/api/admin/agencies', formData);
      setShowCreateDialog(false);
      resetForm();
      loadAgencies();
    } catch (err: any) {
      alert(err.message || 'Failed to create agency');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateAgency = async () => {
    if (!selectedAgency) return;
    try {
      setIsProcessing(true);
      await apiClient.put(`/api/admin/agencies/${selectedAgency.id}`, formData);
      setShowEditDialog(false);
      setSelectedAgency(null);
      resetForm();
      loadAgencies();
    } catch (err: any) {
      alert(err.message || 'Failed to update agency');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (agency: Agency) => {
    try {
      await apiClient.patch(`/api/admin/agencies/${agency.id}/status`, {
        isActive: !agency.isActive
      });
      loadAgencies();
    } catch (err: any) {
      alert(err.message || 'Failed to update agency status');
    }
  };

  const handleDeleteAgency = async (agency: Agency) => {
    if (!confirm(`Are you sure you want to delete ${agency.name}?`)) return;
    try {
      await apiClient.delete(`/api/admin/agencies/${agency.id}`);
      loadAgencies();
    } catch (err: any) {
      alert(err.message || 'Failed to delete agency');
    }
  };

  const openEditDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setFormData({
      name: agency.name,
      email: agency.email,
      phone: agency.phone || '',
      address: agency.address || '',
      description: agency.description || ''
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      description: ''
    });
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground">
            Manage property management agencies
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agency
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agencies ({filteredAgencies.length})
          </CardTitle>
          <CardDescription>
            All registered property management agencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAgencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Agencies Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search' : 'No agencies have been created yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{agency.name}</p>
                        {agency.address && (
                          <p className="text-sm text-muted-foreground">{agency.address}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{agency.email}</p>
                        {agency.phone && (
                          <p className="text-sm text-muted-foreground">{agency.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {agency._count?.properties || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {agency._count?.users || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {agency.isActive ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(agency.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(agency)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(agency)}>
                            {agency.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAgency(agency)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Agency Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agency</DialogTitle>
            <DialogDescription>
              Add a new property management agency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agency Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAgency} disabled={isProcessing}>
              {isProcessing ? 'Creating...' : 'Create Agency'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agency Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agency</DialogTitle>
            <DialogDescription>
              Update agency information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agency Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAgency} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
