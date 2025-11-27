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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  MapPin,
  User,
  Home,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  propertyType: string;
  totalUnits: number;
  occupiedUnits: number;
  isActive: boolean;
  createdAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ properties: Property[] }>('/api/admin/properties');
      setProperties(response.properties || []);
    } catch (err: any) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (property: Property) => {
    try {
      await apiClient.patch(`/api/admin/properties/${property.id}/status`, {
        isActive: !property.isActive
      });
      loadProperties();
    } catch (err: any) {
      alert(err.message || 'Failed to update property status');
    }
  };

  const getPropertyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      apartment: 'bg-blue-100 text-blue-700',
      house: 'bg-green-100 text-green-700',
      commercial: 'bg-purple-100 text-purple-700',
      mixed: 'bg-orange-100 text-orange-700'
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || property.propertyType === typeFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && property.isActive) ||
      (statusFilter === 'inactive' && !property.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getOccupancyRate = (occupied: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
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
      <div>
        <h1 className="text-3xl font-bold">Property Overview</h1>
        <p className="text-muted-foreground">
          View all properties in the system
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold">{properties.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{properties.filter(p => p.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Home className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">
                  {properties.reduce((sum, p) => sum + p.totalUnits, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied Units</p>
                <p className="text-2xl font-bold">
                  {properties.reduce((sum, p) => sum + p.occupiedUnits, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Properties ({filteredProperties.length})
          </CardTitle>
          <CardDescription>
            All registered properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No properties have been created yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getPropertyTypeBadge(property.propertyType)}</TableCell>
                    <TableCell>
                      {property.owner ? (
                        <div>
                          <p className="font-medium">
                            {property.owner.firstName} {property.owner.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {property.owner.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.occupiedUnits}/{property.totalUnits}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${getOccupancyRate(property.occupiedUnits, property.totalUnits)}%` }}
                          />
                        </div>
                        <span className="text-sm">
                          {getOccupancyRate(property.occupiedUnits, property.totalUnits)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.isActive ? (
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
                    <TableCell>{formatDate(property.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/properties/${property.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(property)}>
                            {property.isActive ? (
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
    </div>
  );
}
