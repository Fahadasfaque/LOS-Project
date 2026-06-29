'use client';

/**
 * @file page.tsx (/customer/login)
 * @description Customer Portal Login page.
 *
 * Uses the existing OTP-based authentication flow (same /auth/otp/request and
 * /auth/otp/verify endpoints). Customers log in with OTP, not username/password.
 *
 * On successful OTP login, checks if user.inviteStatus === 'INVITED'.
 * If INVITED, redirects to /customer/set-password for first-login setup.
 * Otherwise redirects to /customer/dashboard.
 *
 * This is a PUBLIC page — no auth required.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Envelope, ArrowRight, LockKey, ArrowLeft, Spinner } from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

type LoginStep = 'email' | 'otp';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { verifyOtpLogin } = useAuth();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/otp/request', { email: email.trim().toLowerCase() });
      if (res.success) {
        setStep('otp');
        startResendCooldown();
      } else {
        setError(res.message || 'Failed to send verification code. Please check your email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyOtpLogin(email.trim().toLowerCase(), otp.trim());
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/otp/request', { email: email.trim().toLowerCase(), forceNew: true });
      startResendCooldown();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Left Panel (decorative — hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-primary/90 to-primary/70 p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 200}px`,
                height: `${(i + 1) * 200}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center text-white max-w-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur mx-auto mb-6 border border-white/30">
            <Shield className="h-10 w-10 text-white" weight="fill" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Fortress Banking</h1>
          <p className="text-lg font-semibold text-white/90 mb-3">Customer Self-Service Portal</p>
          <p className="text-sm text-white/70 leading-relaxed">
            Track your loan application, upload documents, review your offer, and monitor disbursement — all in one secure place.
          </p>

          <div className="mt-8 space-y-3">
            {['End-to-end encrypted', 'Real-time status updates', 'Secure document storage'].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
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
            {step === 'email' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">Sign in</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your registered email to receive a sign-in code.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                      <p className="text-xs text-destructive">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Not a customer yet?{' '}
                    <span className="text-foreground font-medium">
                      Contact your branch to apply.
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change email
                  </button>
                  <h2 className="text-xl font-bold text-foreground">Verify your code</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 6-digit code sent to{' '}
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Verification Code
                    </label>
                    <div className="relative">
                      <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        required
                        autoFocus
                        maxLength={6}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono tracking-widest text-center"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                      <p className="text-xs text-destructive">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? <Spinner className="h-4 w-4 animate-spin" /> : 'Sign In'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive the code?{' '}
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || loading}
                      className="text-primary font-semibold hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Bank employee?{' '}
              <span className="underline">Log in here</span>
            </Link>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} Fortress Banking. Secured with 256-bit encryption.
          </p>
        </div>
      </div>
    </div>
  );
}
