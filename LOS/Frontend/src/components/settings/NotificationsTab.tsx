'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2Icon } from 'lucide-react';

export function NotificationsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailServiceEnabled, setEmailServiceEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingPref, setUpdatingPref] = useState(false);
  const [updatingService, setUpdatingService] = useState(false);

  // Prevent React 18 StrictMode double-fetch
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadAll() {
      try {
        // Always load personal prefs
        const prefsRes = await api.get('/settings/notifications');
        if (prefsRes.success && prefsRes.data) {
          setEmailNotifications(prefsRes.data.emailNotifications ?? true);
        }
      } catch (err) {
        // Silently fall back to default (true) — don't alarm the user on load
        console.error('[NotificationsTab] Failed to load notification prefs:', err);
      }

      if (isAdmin) {
        try {
          const svcRes = await api.get('/settings/email-service');
          if (svcRes.success && svcRes.data) {
            setEmailServiceEnabled(svcRes.data.enabled);
          }
        } catch (err) {
          // Silently fall back to default (true)
          console.error('[NotificationsTab] Failed to load email service status:', err);
        }
      }

      setLoading(false);
    }

    loadAll();
  }, [isAdmin]);

  const handlePrefToggle = async (val: boolean) => {
    setUpdatingPref(true);
    const prev = emailNotifications;
    setEmailNotifications(val);
    try {
      await api.patch('/settings/notifications', { emailNotifications: val });
      toast.success(val ? 'Email notifications enabled.' : 'Email notifications disabled.');
    } catch (err: any) {
      setEmailNotifications(prev);
      toast.error(err.message || 'Failed to update preference.');
    } finally {
      setUpdatingPref(false);
    }
  };

  const handleServiceToggle = async (val: boolean) => {
    setUpdatingService(true);
    const prev = emailServiceEnabled;
    setEmailServiceEnabled(val);
    try {
      await api.patch('/settings/email-service', { enabled: val });
      toast.success(val ? 'Email service enabled.' : 'Email service disabled.');
    } catch (err: any) {
      setEmailServiceEnabled(prev);
      toast.error(err.message || 'Failed to toggle email service.');
    } finally {
      setUpdatingService(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Personal Preferences ── */}
      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Choose what notifications you want to receive
          </p>
        </div>

        <div className="border-t" />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notif-email" className="text-sm font-medium text-foreground">
              Email Notifications
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive notifications via email
            </p>
          </div>
          <Switch
            id="notif-email"
            checked={emailNotifications}
            onCheckedChange={handlePrefToggle}
            disabled={updatingPref}
          />
        </div>
      </div>

      {/* ── Admin: Global Email Service ── */}
      {isAdmin && (
        <div className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">System Administration</h2>
            <p className="text-sm text-muted-foreground">
              Control the LOS platform-wide email service
            </p>
          </div>

          <div className="border-t" />

          {!emailServiceEnabled && (
            <div className="rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <strong>Email service is disabled.</strong> No emails are being sent to any
              user or customer until this is re-enabled.
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-global" className="text-sm font-medium text-foreground">
                Global Email Service
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable or disable all outgoing LOS emails system-wide
              </p>
            </div>
            <Switch
              id="notif-global"
              checked={emailServiceEnabled}
              onCheckedChange={handleServiceToggle}
              disabled={updatingService}
            />
          </div>
        </div>
      )}
    </div>
  );
}
