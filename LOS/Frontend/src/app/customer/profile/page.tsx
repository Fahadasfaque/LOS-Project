'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Spinner,
  IdentificationCard,
  Briefcase,
  MapPin,
  User,
  CheckCircle,
  Warning,
  Lock,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  nomineeName: string | null;
  nomineePhone: string | null;
  occupation: string | null;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = (p: string): { level: number; label: string; color: string } => {
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: 'bg-destructive' };
    if (score === 2) return { level: score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { level: score, label: 'Good', color: 'bg-blue-500' };
    return { level: score, label: 'Strong', color: 'bg-green-500' };
  };

  const { level, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1 mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= level ? color : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${level <= 1 ? 'text-destructive' : level === 2 ? 'text-amber-600' : level === 3 ? 'text-blue-600' : 'text-green-600'}`}>
        Password strength: {label}
      </p>
    </div>
  );
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customer/me');
      if (res.success) {
        const p = res.data;
        setProfile(p);
        setPhone(p.phone || '');
        setOccupation(p.occupation || '');
        setAddress(p.address || '');
        setCity(p.city || '');
        setState(p.state || '');
        setPostalCode(p.postalCode || '');
        setNomineeName(p.nomineeName || '');
        setNomineePhone(p.nomineePhone || '');
      }
    } catch { /* fail silently */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await api.patch('/customer/me', {
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postalCode: postalCode.trim() || null,
        nomineeName: nomineeName.trim() || null,
        nomineePhone: nomineePhone.trim() || null,
        occupation: occupation.trim() || null,
      });
      if (res.success) {
        setProfileSuccess('Profile updated successfully.');
        await fetchProfile();
      } else {
        setProfileError(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post('/customer/change-password', { currentPassword, newPassword });
      if (res.success) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">My Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View and update your registered contact details, address, and nominee information.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* ── Identity Sidebar ── */}
        <Card className="border-border h-fit">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <IdentificationCard className="h-4 w-4 text-muted-foreground" /> Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="flex flex-col items-center text-center py-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-2">
                <span className="text-2xl font-black text-primary">
                  {profile?.firstName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <span className="mt-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                Customer
              </span>
            </div>
            <Separator />
            <div className="space-y-3">
              {[
                { label: 'First Name', value: profile?.firstName || '—' },
                { label: 'Last Name', value: profile?.lastName || '—' },
                { label: 'Email', value: profile?.email || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5 break-all">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Edit Form ── */}
        <div className="md:col-span-2 space-y-4">
          {profileSuccess && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400 font-semibold">{profileSuccess}</AlertDescription>
            </Alert>
          )}
          {profileError && (
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Contact & Employment */}
            <Card className="border-border">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" /> Contact & Employment
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Occupation / Title</Label>
                    <Input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="border-border">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Current Address
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Street Address</Label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street, Apartment 4B"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">City</Label>
                    <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">State</Label>
                    <Input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">PIN Code</Label>
                    <Input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="400001" className="h-9 text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nominee */}
            <Card className="border-border">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Nominee Registry
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Nominee Full Name</Label>
                    <Input type="text" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} placeholder="Jane Doe" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Nominee Phone</Label>
                    <Input type="tel" value={nomineePhone} onChange={(e) => setNomineePhone(e.target.value)} placeholder="+91 88888 88888" className="h-9 text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                {saving ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* ── Change Password ── */}
          <Card className="border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" /> Change Password
              </CardTitle>
              <p className="text-xs text-muted-foreground">Min. 8 characters with a mix of letters, numbers, and symbols.</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {passwordSuccess && (
                <Alert className="border-green-500/30 bg-green-500/10 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400 font-semibold">{passwordSuccess}</AlertDescription>
                </Alert>
              )}
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <Warning className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-9 text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCurrent ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-9 text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNew ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={newPassword} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`h-9 text-xs pr-10 ${confirmPassword && confirmPassword !== newPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirm ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[10px] text-destructive font-semibold">Passwords do not match</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="outline" disabled={changingPassword} className="gap-1.5">
                    {changingPassword ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                    {changingPassword ? 'Changing...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
