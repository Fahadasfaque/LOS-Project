'use client';

/**
 * @file page.tsx (/customer/set-password)
 * @description First-login and Forgot Password reset page for Customer accounts.
 *
 * Two entry paths:
 *   1. INVITED customer clicks link in invitation email → sets password for the first time.
 *   2. ACTIVE customer completes forgot-password OTP → resets password.
 *
 * In both cases, a valid los_token is required (issued by /auth/otp/verify).
 * The page calls POST /customer/set-password with { newPassword }.
 *
 * This page is NOT inside the /customer layout (no sidebar/header).
 * It's a transition page between authentication and the portal.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LockKey, Eye, EyeSlash, CheckCircle, Spinner } from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { label: 'Contains a number', check: (p: string) => /\d/.test(p) },
  { label: 'Contains a letter', check: (p: string) => /[a-zA-Z]/.test(p) },
];

export default function SetPasswordPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const allRulesPass = PASSWORD_RULES.every((r) => r.check(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRulesPass) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/set-password', { newPassword });
      if (res.success) {
        setSuccess(true);
        await refreshSession();
        setTimeout(() => router.push('/customer/dashboard'), 2000);
      } else {
        setError(res.message || 'Failed to set password. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield className="h-5 w-5" weight="fill" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Fortress Banking</p>
            <p className="text-xs text-muted-foreground">Customer Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-xl p-7">
          {success ? (
            <div className="text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" weight="fill" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Password Set!</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Your account is now active. Redirecting to your portal...
              </p>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
                  <LockKey className="h-6 w-6 text-primary" weight="duotone" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Set Your Password</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a secure password to activate your customer portal account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showNew ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength rules */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {PASSWORD_RULES.map((rule) => (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors ${rule.check(newPassword) ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                          <span className={`text-[10px] transition-colors ${rule.check(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? 'border-green-500 focus:border-green-500'
                            : 'border-destructive focus:border-destructive'
                          : 'border-border focus:border-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-[10px] text-destructive mt-1">Passwords do not match.</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !allRulesPass || !passwordsMatch}
                  className="flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? <Spinner className="h-4 w-4 animate-spin" /> : 'Activate Account & Continue'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
          © {new Date().getFullYear()} Fortress Banking. Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
}
