'use client';

/**
 * @file page.tsx (/customer/profile)
 * @description Customer Portal profile view and update.
 *
 * Displays read-only identity fields (Name, Email, Role) and editable contact /
 * application metadata (Address, City, State, Postal Code, Nominee, Occupation).
 */

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Spinner, User, MapPin, Briefcase, CheckCircle, Warning, IdentificationCard } from '@phosphor-icons/react';

interface ProfileData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  customerProfile: {
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    nomineeName: string | null;
    nomineePhone: string | null;
    occupation: string | null;
  } | null;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editable fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [occupation, setOccupation] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customer/me');
      if (res.success && res.data) {
        setProfile(res.data);
        // Bind editable state
        setPhone(res.data.phone || '');
        const cp = res.data.customerProfile;
        setAddress(cp?.address || '');
        setCity(cp?.city || '');
        setState(cp?.state || '');
        setPostalCode(cp?.postalCode || '');
        setNomineeName(cp?.nomineeName || '');
        setNomineePhone(cp?.nomineePhone || '');
        setOccupation(cp?.occupation || '');
      }
    } catch {
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

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
        setSuccessMsg('Profile updated successfully.');
        await fetchProfile();
      } else {
        setErrorMsg(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View your registered customer details and update your contact / nominee profiles.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <Warning className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleUpdate} className="grid gap-6 md:grid-cols-3">
        {/* Read-Only Account Details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2">
            <IdentificationCard className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Identity Profile</h3>
          </div>
          <div className="space-y-3.5 pt-2">
            <ReadOnlyField label="Registered Name" value={`${profile?.firstName} ${profile?.lastName}`} />
            <ReadOnlyField label="Registered Email" value={profile?.email || 'N/A'} />
            <ReadOnlyField label="Account Privilege" value="CUSTOMER" />
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 space-y-4">
          {/* Section: Contact & Employment */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <Briefcase className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Contact & Employment</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Occupation / Title
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Address Details */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Current Address</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Nominee Information */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <User className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Nominee Registry</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Nominee Full Name
                </label>
                <input
                  type="text"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Nominee Phone Number
                </label>
                <input
                  type="text"
                  value={nomineePhone}
                  onChange={(e) => setNomineePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 px-5 items-center justify-center rounded-lg bg-primary hover:bg-primary/95 text-xs font-bold text-primary-foreground shadow transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? <Spinner className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
