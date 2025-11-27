'use client';

import { useEffect, useState } from 'react';
import { adminCommissionsApi, CommissionRule, CommissionReports, Commission, ActionType } from '@/lib/api/admin-commissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Users,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCommissionsPage() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [reports, setReports] = useState<CommissionReports | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');

  // Dialog states
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    actionType: '',
    name: '',
    description: '',
    commissionType: 'percentage' as 'percentage' | 'fixed',
    commissionValue: 0,
    minAmount: '',
    maxAmount: '',
    isActive: true
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Commission filter
  const [commissionFilter, setCommissionFilter] = useState('pending');
  const [commissionPagination, setCommissionPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'commissions') {
      loadCommissions();
    } else if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, commissionFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, typesData] = await Promise.all([
        adminCommissionsApi.getRules(),
        adminCommissionsApi.getActionTypes()
      ]);
      setRules(rulesData);
      setActionTypes(typesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await adminCommissionsApi.getReports();
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    }
  };

  const loadCommissions = async (page = 1) => {
    try {
      const params: any = { page, limit: 20 };
      if (commissionFilter !== 'all') params.status = commissionFilter;

      const data = await adminCommissionsApi.getCommissions(params);
      setCommissions(data.commissions);
      setCommissionPagination(data.pagination);
    } catch (err: any) {
      console.error('Failed to load commissions:', err);
    }
  };

  const handleSaveRule = async () => {
    try {
      setIsProcessing(true);

      const data = {
        actionType: ruleForm.actionType,
        name: ruleForm.name,
        description: ruleForm.description || undefined,
        commissionType: ruleForm.commissionType,
        commissionValue: ruleForm.commissionValue,
        minAmount: ruleForm.minAmount ? Number(ruleForm.minAmount) : undefined,
        maxAmount: ruleForm.maxAmount ? Number(ruleForm.maxAmount) : undefined,
        isActive: ruleForm.isActive
      };

      if (editingRule) {
        await adminCommissionsApi.updateRule(editingRule.id, data);
      } else {
        await adminCommissionsApi.createRule(data);
      }

      setShowRuleDialog(false);
      resetRuleForm();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save rule');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await adminCommissionsApi.deleteRule(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  const handlePayCommission = async (id: string) => {
    try {
      await adminCommissionsApi.payCommission(id);
      loadCommissions(commissionPagination.page);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to pay commission');
    }
  };

  const handlePayBulk = async () => {
    const pendingIds = commissions
      .filter(c => c.status === 'pending')
      .map(c => c.id);

    if (pendingIds.length === 0) {
      alert('No pending commissions to pay');
      return;
    }

    if (!confirm(`Pay ${pendingIds.length} pending commissions?`)) return;

    try {
      await adminCommissionsApi.payBulkCommissions(pendingIds);
      loadCommissions(commissionPagination.page);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to pay commissions');
    }
  };

  const openEditDialog = (rule: CommissionRule) => {
    setEditingRule(rule);
    setRuleForm({
      actionType: rule.actionType,
      name: rule.name,
      description: rule.description || '',
      commissionType: rule.commissionType,
      commissionValue: rule.commissionValue,
      minAmount: rule.minAmount?.toString() || '',
      maxAmount: rule.maxAmount?.toString() || '',
      isActive: rule.isActive
    });
    setShowRuleDialog(true);
  };

  const resetRuleForm = () => {
    setEditingRule(null);
    setRuleForm({
      actionType: '',
      name: '',
      description: '',
      commissionType: 'percentage',
      commissionValue: 0,
      minAmount: '',
      maxAmount: '',
      isActive: true
    });
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

  const getActionTypeLabel = (value: string) => {
    const type = actionTypes.find(t => t.value === value);
    return type?.label || value;
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold">Commission Management</h1>
            <p className="text-muted-foreground">
              Manage commission rules and payouts
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              resetRuleForm();
              setShowRuleDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission Rules
              </CardTitle>
              <CardDescription>
                Define how commissions are calculated for each action type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rules Defined</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create commission rules to enable agent earnings
                  </p>
                  <Button onClick={() => setShowRuleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Rule
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Badge variant="outline">{getActionTypeLabel(rule.actionType)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {rule.commissionType === 'percentage'
                              ? `${rule.commissionValue}%`
                              : formatCurrency(rule.commissionValue)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rule.commissionType === 'percentage' ? 'of transaction' : 'fixed amount'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {rule.minAmount || rule.maxAmount ? (
                            <div className="text-sm">
                              {rule.minAmount && <p>Min: {formatCurrency(rule.minAmount)}</p>}
                              {rule.maxAmount && <p>Max: {formatCurrency(rule.maxAmount)}</p>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(rule)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <div className="flex items-center justify-between">
            <Select value={commissionFilter} onValueChange={setCommissionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {commissionFilter === 'pending' && commissions.length > 0 && (
              <Button onClick={handlePayBulk}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pay All Pending
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Commission Payouts</CardTitle>
              <CardDescription>
                Manage agent commission payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No commissions found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Action</TableHead>
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
                            {commission.agent ? (
                              <div>
                                <p className="font-medium">
                                  {commission.agent.firstName} {commission.agent.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {commission.agent.email}
                                </p>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {commission.transaction ? (
                              <div>
                                <p>{getActionTypeLabel(commission.transaction.actionType)}</p>
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
                            <Badge
                              variant={
                                commission.status === 'paid' ? 'default' :
                                commission.status === 'pending' ? 'outline' :
                                'destructive'
                              }
                            >
                              {commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(commission.createdAt)}</TableCell>
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

                  {commissionPagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {commissionPagination.page} of {commissionPagination.pages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commissionPagination.page <= 1}
                          onClick={() => loadCommissions(commissionPagination.page - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commissionPagination.page >= commissionPagination.pages}
                          onClick={() => loadCommissions(commissionPagination.page + 1)}
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
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {reports && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Commissions</p>
                        <p className="text-2xl font-bold">{formatCurrency(reports.totalCommissions)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(reports.totalPending)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(reports.totalPaid)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    By Agent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.byAgent.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.byAgent.map((item) => (
                          <TableRow key={item.agent.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.agent.firstName} {item.agent.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.agent.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                            <TableCell className="text-orange-600">{formatCurrency(item.pending)}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(item.paid)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* By Action Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    By Action Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.byActionType.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action Type</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Total Commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.byActionType.map((item) => (
                          <TableRow key={item.actionType}>
                            <TableCell>
                              <Badge variant="outline">{item.label}</Badge>
                            </TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Commission Rule'}</DialogTitle>
            <DialogDescription>
              Define how commissions are calculated for agent actions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={ruleForm.actionType}
                onValueChange={(v) => setRuleForm({ ...ruleForm, actionType: v })}
                disabled={!!editingRule}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Standard Rent Collection Commission"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="Describe this commission rule..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission Type</Label>
                <Select
                  value={ruleForm.commissionType}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, commissionType: v as 'percentage' | 'fixed' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {ruleForm.commissionType === 'percentage' ? 'Percentage (%)' : 'Amount (RWF)'}
                </Label>
                <Input
                  type="number"
                  value={ruleForm.commissionValue}
                  onChange={(e) => setRuleForm({ ...ruleForm, commissionValue: Number(e.target.value) })}
                  min={0}
                  step={ruleForm.commissionType === 'percentage' ? '0.1' : '100'}
                />
              </div>
            </div>

            {ruleForm.commissionType === 'percentage' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Commission (RWF, optional)</Label>
                  <Input
                    type="number"
                    value={ruleForm.minAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, minAmount: e.target.value })}
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Commission (RWF, optional)</Label>
                  <Input
                    type="number"
                    value={ruleForm.maxAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxAmount: e.target.value })}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={ruleForm.isActive}
                onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={isProcessing || !ruleForm.actionType || !ruleForm.name}>
              {isProcessing ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
