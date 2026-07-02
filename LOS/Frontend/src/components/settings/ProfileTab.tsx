'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData { firstName: string; lastName: string; email: string; role: string; }

// Mirror backend Zod regex for names
const NAME_RE = /^[a-zA-Z\s'-]*$/;

function nameError(val: string, fieldLabel: string): string | undefined {
  if (!val.trim() && fieldLabel === 'First Name') return 'First name is required.';
  if (val.length > 50) return `${fieldLabel} must not exceed 50 characters.`;
  if (val && !NAME_RE.test(val)) return `${fieldLabel} can only contain letters, spaces, hyphens, and apostrophes.`;
  return undefined;
}

export function ProfileTab() {
  const { refreshSession } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({ firstName: '', lastName: '', email: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [touched, setTouched] = useState({ firstName: false, lastName: false });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    async function load() {
      try {
        const res = await api.get('/settings/profile');
        if (res.success && res.data) {
          setProfile({
            firstName: res.data.firstName || '',
            lastName:  res.data.lastName  || '',
            email:     res.data.email     || '',
            role:      res.data.role      || '',
          });
        }
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  const firstNameErr = touched.firstName ? nameError(profile.firstName, 'First Name') : undefined;
  const lastNameErr  = touched.lastName  ? nameError(profile.lastName,  'Last Name')  : undefined;
  const hasErrors    = !!nameError(profile.firstName, 'First Name') || !!nameError(profile.lastName, 'Last Name');

  const handleSave = async () => {
    // Touch all fields to show validation before submit
    setTouched({ firstName: true, lastName: true });
    if (hasErrors) return;

    setLoading(true);
    try {
      await api.patch('/settings/profile', {
        firstName: profile.firstName.trim(),
        lastName:  profile.lastName.trim(),
      });
      await refreshSession();
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || '--';

  if (fetching) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Profile Information</h2>
        <p className="text-sm text-muted-foreground">Update your account profile details</p>
      </div>

      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-foreground flex items-center justify-center text-background text-lg font-bold select-none shrink-0">
          {initials}
        </div>
        <div className="leading-tight">
          <p className="font-medium text-foreground text-sm">{profile.firstName} {profile.lastName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
        </div>
      </div>

      <div className="border-t" />

      {/* Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="settings-firstName" className="text-sm font-medium">First Name</Label>
          <Input
            id="settings-firstName"
            value={profile.firstName}
            onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
            placeholder="First name"
            className={cn(firstNameErr && 'border-destructive focus-visible:ring-destructive')}
          />
          {firstNameErr && <p className="text-xs text-destructive">{firstNameErr}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-lastName" className="text-sm font-medium">Last Name</Label>
          <Input
            id="settings-lastName"
            value={profile.lastName}
            onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
            placeholder="Last name"
            className={cn(lastNameErr && 'border-destructive focus-visible:ring-destructive')}
          />
          {lastNameErr && <p className="text-xs text-destructive">{lastNameErr}</p>}
        </div>
      </div>

      {/* Email — locked */}
      <div className="space-y-1.5">
        <Label htmlFor="settings-email" className="text-sm font-medium">
          Email Address{' '}
          <span className="font-normal text-muted-foreground">(cannot be changed)</span>
        </Label>
        <Input
          id="settings-email"
          value={profile.email}
          disabled
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
          {loading ? <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
