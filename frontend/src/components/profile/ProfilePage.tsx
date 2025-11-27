'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi, UserProfile } from '@/lib/api/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Trash2,
  Save,
  Loader2,
  Edit2,
  Building2,
  DollarSign,
  Activity,
  Shield,
  CreditCard
} from 'lucide-react';
import { clearSession } from '@/lib/session';

interface ProfilePageProps {
  title?: string;
  showDeleteAccount?: boolean;
}

export default function ProfilePage({ title = 'Profile', showDeleteAccount = true }: ProfilePageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setNationalId(data.nationalId || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const updateData: any = {
        firstName,
        lastName,
        phone
      };

      // Only include nationalId for non-super_admin users
      if (profile?.role !== 'super_admin') {
        updateData.nationalId = nationalId;
      }

      const updated = await profileApi.updateProfile(updateData);
      setProfile(prev => prev ? { ...prev, ...updated } : prev);
      setSaveSuccess('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword
      });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await profileApi.deleteAccount(deletePassword);
      clearSession();
      router.push('/login');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-700',
      agency: 'bg-purple-100 text-purple-700',
      owner: 'bg-blue-100 text-blue-700',
      manager: 'bg-cyan-100 text-cyan-700',
      tenant: 'bg-green-100 text-green-700',
      maintenance: 'bg-orange-100 text-orange-700',
      agent: 'bg-amber-100 text-amber-700'
    };
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      agency: 'Agency',
      owner: 'Owner',
      manager: 'Manager',
      tenant: 'Tenant',
      maintenance: 'Maintenance',
      agent: 'Agent'
    };
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-700'}>
        {labels[role] || role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveSuccess && (
              <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                {saveSuccess}
              </p>
            )}
            {saveError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {saveError}
              </p>
            )}

            {editMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                {profile?.role !== 'super_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="Enter your national ID"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Name:</span>
                    <p className="font-medium">
                      {profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone || 'Not set'}</span>
                  </div>
                  {profile.role !== 'super_admin' && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground text-sm">National ID: </span>
                        <span>{profile.nationalId || 'Not set'}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Role</p>
              <div className="mt-1">{getRoleBadge(profile.role)}</div>
            </div>

            {/* Role-specific stats */}
            {profile.role === 'owner' && profile.propertiesOwned !== undefined && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Properties Owned</p>
                </div>
                <p className="text-3xl font-bold mt-1">{profile.propertiesOwned}</p>
              </div>
            )}

            {profile.role === 'manager' && profile.propertiesManaged !== undefined && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Properties Managed</p>
                </div>
                <p className="text-3xl font-bold mt-1">{profile.propertiesManaged}</p>
              </div>
            )}

            {profile.role === 'agent' && (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                  </div>
                  <p className="text-3xl font-bold mt-1">{profile.transactionCount || 0}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-600">Total Earned</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(profile.totalEarned || 0)}
                  </p>
                </div>
              </>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Account Status</p>
              <Badge className={profile.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded mb-4">
              {passwordSuccess}
            </p>
          )}

          {showPasswordForm ? (
            <div className="space-y-4 max-w-md">
              {passwordError && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {passwordError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} disabled={passwordSaving}>
                  {passwordSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Account */}
      {showDeleteAccount && profile.role !== 'super_admin' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    className="mt-2"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                  />
                  {deleteError && (
                    <p className="text-sm text-destructive mt-2">{deleteError}</p>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setDeletePassword('');
                    setDeleteError('');
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
