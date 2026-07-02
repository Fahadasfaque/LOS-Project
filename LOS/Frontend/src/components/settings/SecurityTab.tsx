'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon, Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Password rules (must mirror backend Zod schema) ────────────────────────
const RULES = [
  { key: 'length',   test: (p: string) => p.length >= 8,        label: 'At least 8 characters'          },
  { key: 'upper',    test: (p: string) => /[A-Z]/.test(p),      label: 'One uppercase letter'            },
  { key: 'lower',    test: (p: string) => /[a-z]/.test(p),      label: 'One lowercase letter'            },
  { key: 'number',   test: (p: string) => /[0-9]/.test(p),      label: 'One number'                      },
];

function RuleItem({ passed, label }: { passed: boolean; label: string }) {
  return (
    <li className={cn('flex items-center gap-1.5 text-xs', passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
      {passed
        ? <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0" />
        : <XCircleIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
      {label}
    </li>
  );
}

export function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleShow = (field: keyof typeof show) =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  const markTouched = (field: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [field]: true }));

  // ── Rule evaluation ──────────────────────────────────────────────────────
  const ruleResults = RULES.map((r) => ({ ...r, passed: r.test(form.newPassword) }));
  const allRulesPassed = ruleResults.every((r) => r.passed);
  const passwordsMatch  = form.newPassword === form.confirmPassword;
  const notSameAsCurrent = form.currentPassword !== form.newPassword;

  const canSubmit =
    form.currentPassword.length > 0 &&
    allRulesPassed &&
    passwordsMatch &&
    notSameAsCurrent;

  const handleSubmit = async () => {
    if (!form.currentPassword) return toast.error('Enter your current password.');
    if (!allRulesPassed)       return toast.error('New password does not meet all requirements.');
    if (!passwordsMatch)       return toast.error('Passwords do not match.');
    if (!notSameAsCurrent)     return toast.error('New password must differ from current password.');

    setLoading(true);
    try {
      await api.patch('/settings/security', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      toast.success('Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTouched({ newPassword: false, confirmPassword: false });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const showMismatch = touched.confirmPassword && form.confirmPassword.length > 0 && !passwordsMatch;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Change Password</h2>
        <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
      </div>

      <div className="border-t" />

      {/* Current password */}
      <PasswordField
        id="settings-currentPwd"
        label="Current Password"
        value={form.currentPassword}
        onChange={set('currentPassword')}
        show={show.current}
        onToggle={() => toggleShow('current')}
        placeholder="Enter current password"
      />

      {/* New + Confirm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <PasswordField
            id="settings-newPwd"
            label="New Password"
            value={form.newPassword}
            onChange={set('newPassword')}
            show={show.next}
            onToggle={() => toggleShow('next')}
            placeholder="Enter new password"
            onBlur={() => markTouched('newPassword')}
          />
        </div>
        <div className="space-y-1.5">
          <PasswordField
            id="settings-confirmPwd"
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            show={show.confirm}
            onToggle={() => toggleShow('confirm')}
            placeholder="Confirm new password"
            onBlur={() => markTouched('confirmPassword')}
            error={showMismatch ? 'Passwords do not match' : undefined}
          />
        </div>
      </div>

      {/* ── Password strength rules ── */}
      {(touched.newPassword || form.newPassword.length > 0) && (
        <div className="rounded-md border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium text-foreground mb-2">Password requirements:</p>
          <ul className="grid grid-cols-2 gap-1">
            {ruleResults.map((r) => (
              <RuleItem key={r.key} passed={r.passed} label={r.label} />
            ))}
            <RuleItem
              passed={notSameAsCurrent && form.newPassword.length > 0}
              label="Different from current password"
            />
          </ul>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="min-w-[140px]"
        >
          {loading
            ? <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Updating…</>
            : 'Update Password'}
        </Button>
      </div>
    </div>
  );
}

function PasswordField({
  id, label, value, onChange, show, onToggle, placeholder, onBlur, error,
}: {
  id: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean; onToggle: () => void; placeholder: string;
  onBlur?: () => void; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn('pr-10', error && 'border-destructive focus-visible:ring-destructive')}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? 'Hide' : 'Show'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
