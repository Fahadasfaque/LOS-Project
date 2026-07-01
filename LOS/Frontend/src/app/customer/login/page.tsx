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
import {
  Shield,
  Lock,
  Clock,
  FileText,
  ShieldCheck,
  Envelope,
  ArrowRight,
  ArrowLeft,
  Spinner,
  MapPin,
  LockKey
} from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginStep = 'email' | 'otp';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, verifyOtpLogin } = useAuth();

  React.useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'CUSTOMER') {
        router.replace('/customer/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);
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
    <div className="flex min-h-screen bg-white dark:bg-[#020b18] overflow-hidden">
      
      {/* Left Panel: Brand & Illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col bg-gradient-to-b from-[#0C46A2] via-[#093583] to-[#041D52] p-16 relative overflow-hidden shrink-0 border-r border-slate-200/10">
        
        {/* Background circular grid lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none select-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 350}px`,
                height: `${(i + 1) * 350}px`,
                top: '-10%',
                right: '-10%',
              }}
            />
          ))}
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-4 mb-16 self-start select-none relative z-10">
          <Shield className="h-14 w-14 text-white" weight="fill" />
          <div className="text-left">
            <h2 className="text-2xl font-black tracking-wide text-white uppercase leading-none">Fortress Banking</h2>
            <span className="text-xs text-white/70 tracking-widest font-semibold block mt-1.5 uppercase">Trust. Strength. Security.</span>
          </div>
        </div>

        {/* Brand Content */}
        <div className="relative z-10 text-left text-white max-w-md space-y-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Customer Self-Service Portal</h1>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              Track your loan application, upload documents, review your offer, and monitor disbursement — all in one secure place.
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/10 shadow-sm">
                <Lock className="h-5 w-5" weight="bold" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-snug">End-to-end encrypted</h4>
                <p className="text-xs text-white/70 font-medium mt-0.5 leading-normal">
                  Your data is protected with bank-grade security
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/10 shadow-sm">
                <Clock className="h-5 w-5" weight="bold" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-snug">Real-time status updates</h4>
                <p className="text-xs text-white/70 font-medium mt-0.5 leading-normal">
                  Stay informed at every step of your application
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/10 shadow-sm">
                <FileText className="h-5 w-5" weight="bold" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-snug">Secure document storage</h4>
                <p className="text-xs text-white/70 font-medium mt-0.5 leading-normal">
                  Upload and access your documents safely
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/10 shadow-sm">
                <ShieldCheck className="h-5 w-5" weight="bold" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-snug">Always secure, always available</h4>
                <p className="text-xs text-white/70 font-medium mt-0.5 leading-normal">
                  Bank-grade security you can rely on
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Skyline Vector Illustration */}
        <div className="absolute bottom-0 left-0 w-full select-none pointer-events-none">
          <img
            src="/images/login-building.png"
            alt="Fortress Banking Skyline"
            className="w-full opacity-85 object-contain"
          />
        </div>
      </div>

      {/* Right Panel: Login Form Area (No nested card border/shadow!) */}
      <div className="flex flex-1 flex-col justify-between p-8 relative min-h-screen bg-white dark:bg-slate-950">
        
        {/* Curved concentric lines in top-right and bottom-right corners */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-15 pointer-events-none select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" strokeWidth="0.3">
            <circle cx="100" cy="0" r="30" />
            <circle cx="100" cy="0" r="50" />
            <circle cx="100" cy="0" r="70" />
            <circle cx="100" cy="0" r="90" />
            <circle cx="100" cy="0" r="110" />
            <circle cx="100" cy="0" r="130" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-80 h-80 opacity-15 pointer-events-none select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" strokeWidth="0.3">
            <circle cx="100" cy="100" r="30" />
            <circle cx="100" cy="100" r="50" />
            <circle cx="100" cy="100" r="70" />
            <circle cx="100" cy="100" r="90" />
            <circle cx="100" cy="100" r="110" />
            <circle cx="100" cy="100" r="130" />
          </svg>
        </div>

        <div /> {/* Spacer for centering */}

        <div className="w-full max-w-[420px] mx-auto relative z-10 my-auto py-6">
          {/* Mobile brand header (shown on mobile layout) */}
          <div className="lg:hidden flex items-center gap-3 mb-8 select-none">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A2540] text-white shadow-sm">
              <Shield className="h-6 w-6" weight="fill" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">Fortress Banking</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1">Customer Portal</p>
            </div>
          </div>

          {step === 'email' ? (
            <div className="space-y-6">
              <div className="text-left space-y-2 select-none">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sign in</h2>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Enter your registered email to receive a sign-in code.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email address"
                      required
                      autoFocus
                      className="w-full pl-10 pr-3 h-11 bg-background border-blue-600 text-foreground placeholder:text-muted-foreground shadow-sm text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-blue-600 focus:border-blue-650"
                    />
                  </div>
                </div>

                {/* Remember Me and Forgot Email row */}
                <div className="flex items-center justify-between text-xs select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      defaultChecked
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-650 focus:ring-blue-500 accent-blue-650 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-slate-600 dark:text-slate-400 font-bold cursor-pointer">
                      Remember this device
                    </label>
                  </div>
                  <Link href="#" className="text-blue-650 font-bold hover:underline">
                    Forgot email?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-left">
                    <p className="text-xs text-destructive font-semibold leading-normal">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 flex items-center justify-center gap-2 rounded-lg shadow-sm cursor-pointer text-xs"
                >
                  {loading ? (
                    <Spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" weight="bold" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6 select-none">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-950 px-3 text-muted-foreground font-semibold">OR</span>
                </div>
              </div>

              {/* Apply Option */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-blue-600 bg-background text-blue-600 hover:text-blue-700 dark:text-slate-200 font-bold h-11 flex items-center justify-center gap-2 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50/10 text-xs"
              >
                <MapPin className="h-4.5 w-4.5 text-blue-600" weight="bold" />
                Contact your branch to apply
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-left space-y-2">
                <button
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 cursor-pointer transition-colors font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" weight="bold" />
                  Change email
                </button>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Verify your code</h2>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-100">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="otp" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <LockKey className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      autoFocus
                      maxLength={6}
                      className="w-full pl-10 pr-3 h-11 bg-background border-blue-600 text-foreground placeholder:text-muted-foreground shadow-sm text-xs rounded-lg font-mono tracking-widest text-center focus-visible:ring-1 focus-visible:ring-blue-600"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-left">
                    <p className="text-xs text-destructive font-semibold leading-normal">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-650 hover:bg-blue-750 text-white font-bold h-11 flex items-center justify-center gap-2 rounded-lg shadow-sm cursor-pointer text-xs"
                >
                  {loading ? <Spinner className="h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
              </form>

              <div className="mt-4 text-center select-none">
                <p className="text-xs text-muted-foreground font-semibold">
                  Didn&apos;t receive the code?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-blue-600 font-bold hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Encryption Banner below the card */}
          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/75 select-none">
            <ShieldCheck className="h-4.5 w-4.5 text-muted-foreground/60 shrink-0" />
            <span className="text-[11px] font-semibold">Your information is secure with 256-bit encryption</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/60 font-semibold select-none">
          © 2026 Fortress Banking. All rights reserved.
        </p>
      </div>
    </div>
  );
}
