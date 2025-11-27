'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Building2,
  Mail,
  Bell,
  Shield,
  DollarSign,
  Save,
  Globe
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Renta',
    siteDescription: 'Property Management Platform',
    supportEmail: 'support@renta.rw',
    supportPhone: '+250 788 000 000',
    timezone: 'Africa/Kigali',
    currency: 'RWF'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    paymentReminders: true,
    maintenanceAlerts: true,
    newUserNotifications: true
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enableOnlinePayments: true,
    paymentGracePeriod: 5,
    lateFeePercentage: 5,
    enableMoMo: true,
    enableBankTransfer: true
  });

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('General settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Notification settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayments = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Payment settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic system configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input
                value={generalSettings.siteName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                type="email"
                value={generalSettings.supportEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Site Description</Label>
            <Textarea
              value={generalSettings.siteDescription}
              onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Support Phone</Label>
              <Input
                value={generalSettings.supportPhone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={generalSettings.timezone}
                onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kigali">Africa/Kigali (CAT)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={generalSettings.currency}
                onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure system notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Send notifications via email</p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
            </div>
            <Switch
              checked={notificationSettings.smsNotifications}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Payment Reminders</p>
              <p className="text-sm text-muted-foreground">Remind tenants about upcoming payments</p>
            </div>
            <Switch
              checked={notificationSettings.paymentReminders}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, paymentReminders: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Alerts</p>
              <p className="text-sm text-muted-foreground">Notify owners about maintenance requests</p>
            </div>
            <Switch
              checked={notificationSettings.maintenanceAlerts}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, maintenanceAlerts: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New User Notifications</p>
              <p className="text-sm text-muted-foreground">Notify admins about new registrations</p>
            </div>
            <Switch
              checked={notificationSettings.newUserNotifications}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newUserNotifications: checked })}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>
            Configure payment options and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Online Payments</p>
              <p className="text-sm text-muted-foreground">Allow tenants to pay rent online</p>
            </div>
            <Switch
              checked={paymentSettings.enableOnlinePayments}
              onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableOnlinePayments: checked })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment Grace Period (days)</Label>
              <Input
                type="number"
                value={paymentSettings.paymentGracePeriod}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentGracePeriod: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Late Fee (%)</Label>
              <Input
                type="number"
                value={paymentSettings.lateFeePercentage}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, lateFeePercentage: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Payment Methods</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mobile Money (MoMo)</p>
                  <p className="text-sm text-muted-foreground">Accept MTN/Airtel Money payments</p>
                </div>
                <Switch
                  checked={paymentSettings.enableMoMo}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableMoMo: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-sm text-muted-foreground">Accept direct bank transfers</p>
                </div>
                <Switch
                  checked={paymentSettings.enableBankTransfer}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableBankTransfer: checked })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePayments} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings changes are logged for security purposes. Contact system administrator for
            advanced security configurations or to reset any compromised settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
