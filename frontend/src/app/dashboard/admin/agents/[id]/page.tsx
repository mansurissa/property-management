'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminAgentsApi, AgentDetails, AgentTransaction, AgentCommission } from '@/lib/api/admin-agents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Activity,
  CreditCard,
  UserX,
  UserCheck,
  KeyRound,
  Copy
} from 'lucide-react';
import Link from 'next/link';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  useEffect(() => {
    if (activeTab === 'transactions' && transactions.length === 0) {
      loadTransactions();
    } else if (activeTab === 'commissions' && commissions.length === 0) {
      loadCommissions();
    }
  }, [activeTab]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const data = await adminAgentsApi.getAgent(agentId);
      setAgent(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await adminAgentsApi.getAgentTransactions(agentId, { limit: 50 });
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    }
  };

  const loadCommissions = async () => {
    try {
      const data = await adminAgentsApi.getAgentCommissions(agentId, { limit: 50 });
      setCommissions(data.commissions);
    } catch (err: any) {
      console.error('Failed to load commissions:', err);
    }
  };

  const handleToggleStatus = async () => {
    if (!agent) return;

    try {
      setIsProcessing(true);
      if (agent.isActive) {
        await adminAgentsApi.suspendAgent(agentId);
      } else {
        await adminAgentsApi.activateAgent(agentId);
      }
      loadAgent();
    } catch (err: any) {
      alert(err.message || 'Failed to update agent status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsProcessing(true);
      const result = await adminAgentsApi.resetAgentPassword(agentId);
      setNewPassword(result.temporaryPassword);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
      setShowResetPasswordDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayCommission = async (commissionId: string) => {
    try {
      await adminAgentsApi.payCommission(commissionId);
      loadCommissions();
      loadAgent();
    } catch (err: any) {
      alert(err.message || 'Failed to pay commission');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'property_registration': 'Property Registration',
      'tenant_onboarding': 'Tenant Onboarding',
      'rent_collection': 'Rent Collection',
      'maintenance_submission': 'Maintenance Request',
      'tenant_info_update': 'Tenant Info Update',
      'lease_renewal': 'Lease Renewal'
    };
    return labels[actionType] || actionType;
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-700">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/agents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Agent Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error || 'Agent not found'}</p>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold">{agent.firstName} {agent.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-muted-foreground">Agent</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetPasswordDialog(true)}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
          <Button
            variant={agent.isActive ? 'destructive' : 'default'}
            onClick={handleToggleStatus}
            disabled={isProcessing}
          >
            {agent.isActive ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Suspend
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(agent.earnings.totalEarned)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(agent.earnings.pendingEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(agent.earnings.paidEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{agent.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{agent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{agent.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(agent.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Info */}
          {agent.application && (
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agent.application.nationalId && (
                  <div>
                    <p className="text-sm text-muted-foreground">National ID</p>
                    <p className="font-medium">{agent.application.nationalId}</p>
                  </div>
                )}
                {agent.application.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{agent.application.address}, {agent.application.city}</p>
                  </div>
                )}
                {agent.application.motivation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motivation</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{agent.application.motivation}</p>
                  </div>
                )}
                {agent.application.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{agent.application.experience}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All actions performed by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getActionTypeLabel(tx.actionType)}</p>
                            {tx.description && (
                              <p className="text-sm text-muted-foreground">{tx.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tx.targetUser ? (
                            <div>
                              <p>{tx.targetUser.firstName} {tx.targetUser.lastName}</p>
                              <p className="text-sm text-muted-foreground">{tx.targetUser.email}</p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {tx.commission ? (
                            <div>
                              <p className="font-medium text-green-600">
                                {formatCurrency(tx.commission.amount)}
                              </p>
                              {getCommissionStatusBadge(tx.commission.status)}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{formatDateTime(tx.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commissions</CardTitle>
              <CardDescription>All commissions earned by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No commissions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {commission.transaction ? (
                            <div>
                              <p className="font-medium">
                                {getActionTypeLabel(commission.transaction.actionType)}
                              </p>
                              {commission.transaction.description && (
                                <p className="text-sm text-muted-foreground">
                                  {commission.transaction.description}
                                </p>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(commission.amount)}
                        </TableCell>
                        <TableCell>
                          {getCommissionStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell>{formatDateTime(commission.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {commission.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handlePayCommission(commission.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={(open) => {
        setShowResetPasswordDialog(open);
        if (!open) setNewPassword('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Agent Password</DialogTitle>
            <DialogDescription>
              {newPassword
                ? 'A new temporary password has been generated'
                : 'Generate a new temporary password for this agent'}
            </DialogDescription>
          </DialogHeader>

          {newPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Temporary Password
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white rounded border font-mono text-sm">
                    {newPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  Share this password with the agent. They will be required to change it on first login.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Are you sure you want to reset the password for {agent.firstName} {agent.lastName}?
            </p>
          )}

          <DialogFooter>
            {newPassword ? (
              <Button onClick={() => {
                setShowResetPasswordDialog(false);
                setNewPassword('');
              }}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowResetPasswordDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleResetPassword} disabled={isProcessing}>
                  {isProcessing ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
