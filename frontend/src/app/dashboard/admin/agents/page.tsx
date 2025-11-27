'use client';

import { useEffect, useState } from 'react';
import { adminAgentsApi, Agent } from '@/lib/api/admin-agents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Users,
  Search,
  Eye,
  UserX,
  UserCheck,
  FileText,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    loadAgents();
  }, [statusFilter]);

  const loadAgents = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const data = await adminAgentsApi.getAgents(params);
      setAgents(data.agents);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAgents(1);
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      if (agent.isActive) {
        await adminAgentsApi.suspendAgent(agent.id);
      } else {
        await adminAgentsApi.activateAgent(agent.id);
      }
      loadAgents(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to update agent status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && agents.length === 0) {
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
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">
            Manage Renta agents and their commissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/agents/applications">
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/commissions">
              <DollarSign className="h-4 w-4 mr-2" />
              Commissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
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
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agents ({pagination.total})
          </CardTitle>
          <CardDescription>
            All registered agents and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
              <p className="text-muted-foreground text-center">
                {search || statusFilter !== 'all'
                  ? 'No agents match your search criteria'
                  : 'No agents have been approved yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {agent.firstName} {agent.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{agent.phone}</TableCell>
                      <TableCell>
                        <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{agent.transactionCount}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(agent.totalEarned)}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium">
                        {formatCurrency(agent.pendingEarnings)}
                      </TableCell>
                      <TableCell>{formatDate(agent.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/admin/agents/${agent.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(agent)}
                          >
                            {agent.isActive ? (
                              <UserX className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
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
                      onClick={() => loadAgents(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => loadAgents(pagination.page + 1)}
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
    </div>
  );
}
