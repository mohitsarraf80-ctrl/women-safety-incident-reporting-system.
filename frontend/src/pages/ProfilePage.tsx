import { CheckCircle2, KeyRound, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { toApiError } from '../api/client';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Input } from '../components/common/Field';
import { PageHeader } from '../components/common/PageHeader';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile(displayName.trim(), phone.trim() || undefined);
      setUser(updated);
      toast.success('Profile updated', 'Your display name and contact details were saved.');
    } catch (error) {
      setProfileError(toApiError(error).detail ?? 'Could not update the profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed', 'Use your new password the next time you sign in.');
    } catch (error) {
      setPasswordError(toApiError(error).detail ?? 'Could not change the password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile & settings"
        description="Manage how your account appears and keep your credentials secure."
        actions={
          <Button variant="outline" onClick={signOut} icon={<LogOut className="h-4 w-4" />}>
            Sign out
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Profile details" description="Your display name is visible to responders assigned to your reports." />
          <CardBody>
            <form className="space-y-4" onSubmit={saveProfile}>
              {profileError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" htmlFor="displayName" required>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="displayName" className="pl-9" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                  </div>
                </Field>
                <Field label="Phone number" htmlFor="phone" hint="Optional. Never shown publicly.">
                  <Input id="phone" value={phone ?? ''} onChange={(event) => setPhone(event.target.value)} />
                </Field>
              </div>
              <Field label="Email address" htmlFor="email" hint="Email changes are not supported in this prototype.">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="email" className="pl-9" value={user.email} disabled />
                </div>
              </Field>
              <div className="flex justify-end">
                <Button type="submit" loading={savingProfile} disabled={displayName.trim().length < 2}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Role</span>
                <Badge tone="brand">{user.roleLabel}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Member since</span>
                <span className="text-slate-900">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Active account
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Your session token is stored in this tab only and is revoked when you sign out.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Privacy reminder" />
            <CardBody className="space-y-2 text-xs leading-relaxed text-slate-600">
              <p className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Anonymous reports are never linked to this account, even when you are signed in.
              </p>
              <p className="flex gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Keep tracking codes outside your account: they are the only way to see an anonymous report.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Change password" description="Use at least 8 characters including a letter and a number." />
        <CardBody>
          <form className="grid gap-4 sm:grid-cols-3" onSubmit={savePassword}>
            {passwordError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3">
                {passwordError}
              </div>
            ) : null}
            <Field label="Current password" htmlFor="currentPassword" required>
              <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </Field>
            <Field label="New password" htmlFor="newPassword" required>
              <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </Field>
            <Field label="Confirm new password" htmlFor="confirmPassword" required>
              <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </Field>
            <div className="sm:col-span-3 flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                loading={savingPassword}
                disabled={!currentPassword || newPassword.length < 8}
              >
                Update password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
