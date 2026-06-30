'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Shield,
  ShieldCheck,
  CheckCircle,
  Lock,
  Envelope,
  Eye,
  EyeSlash,
  CircleNotch,
  WarningCircle,
  User,
  TrendUp,
  DotsThree,
  FileText,
  Key
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  password: z.string().optional().refine(val => !val || val.length >= 6, 'Password must be at least 6 characters.'),
  otp: z.string().optional().refine(val => !val || /^\d{6}$/.test(val), 'OTP must be a 6-digit number.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, requestOtp, verifyOtpLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [authError, setAuthError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setError,
    watch,
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      otp: '',
    },
  });

  const watchedEmail = watch('email');
  const watchedOtp = watch('otp');

  // Cooldown timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setAuthError(null);
    try {
      const emailValue = getValues('email');
      await requestOtp(emailValue);
      setResendCooldown(60);
      toast.success('A new verification code has been sent.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (loginMode === 'password') {
        if (!data.password) {
          setError('password', { type: 'manual', message: 'Password is required.' });
          setLoading(false);
          return;
        }
        await login(data.email, data.password);
      } else if (loginMode === 'otp' && otpStep === 'request') {
        await requestOtp(data.email);
        setOtpStep('verify');
        setResendCooldown(60);
      } else if (loginMode === 'otp' && otpStep === 'verify') {
        if (!data.otp) {
          setError('otp', { type: 'manual', message: 'OTP is required.' });
          setLoading(false);
          return;
        }
        await verifyOtpLogin(data.email, data.otp);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-50 justify-between p-4 sm:p-6 md:p-8">
      {/* Top spacer for layout balance */}
      <div className="hidden sm:block" />

      {/* Main Split Container */}
      <main className="max-w-5xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* Left Pane - Login Form */}
        <section className="w-full md:w-1/2 p-8 sm:p-12 md:p-14 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-2 mb-8 select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/image.png" alt="Fortress Banking Logo" className="h-10 w-auto object-contain" />
            </div>

            {/* Header typography instead of standard line divider */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Access your enterprise banking console
              </p>
            </div>

            {/* Inline Error Alert */}
            {authError && (
              <div 
                className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold mb-5 flex items-start gap-2.5 animate-in fade-in duration-200"
                role="alert"
              >
                <WarningCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" weight="fill" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form Mode Tabs for Password / OTP */}
            {otpStep === 'request' && (
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-6 border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => { setLoginMode('password'); setAuthError(null); }}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
                    loginMode === 'password' 
                      ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('otp'); setAuthError(null); }}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
                    loginMode === 'otp' 
                      ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Email OTP
                </button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* PASSWORD MODE: Email & Password */}
              {loginMode === 'password' && (
                <>
                  {/* Email */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                      Email address
                    </Label>
                    <div className="relative">
                      <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white placeholder-slate-400/80 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:ring-offset-0 transition-all rounded-lg text-xs"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1.5">
                        <WarningCircle className="h-4 w-4" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                        Password
                      </Label>
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setAuthError("Please contact your IT administrator to reset your password."); }} 
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      >
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white placeholder-slate-400/80 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:ring-offset-0 transition-all rounded-lg text-xs"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeSlash className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1.5">
                        <WarningCircle className="h-4 w-4" /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2.5 py-1 select-none">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 bg-white dark:bg-slate-950 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <Label htmlFor="remember" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                      Remember this device
                    </Label>
                  </div>
                </>
              )}

              {/* OTP MODE: Email and OTP code field underneath */}
              {loginMode === 'otp' && (
                <>
                  {/* Email (Always visible) */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                        Email address
                      </Label>
                      {otpStep === 'verify' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep('request');
                            setValue('otp', '');
                            setAuthError(null);
                            setResendCooldown(0);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          Change Email
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        disabled={otpStep === 'verify'}
                        className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white placeholder-slate-400/80 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:ring-offset-0 transition-all rounded-lg text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1.5">
                        <WarningCircle className="h-4 w-4" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* OTP Field (Visible at the bottom, disabled by default) */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="otp" className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                        Verification Code
                      </Label>
                      {otpStep === 'verify' && (
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || loading}
                          onClick={handleResendOtp}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP code"
                        disabled={otpStep === 'request'}
                        className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-955 dark:text-white placeholder-slate-400/80 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:ring-offset-0 transition-all rounded-lg text-xs font-mono tracking-widest disabled:opacity-50 disabled:bg-slate-100/50 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed"
                        maxLength={6}
                        {...register('otp')}
                      />
                    </div>
                    {errors.otp && (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1.5">
                        <WarningCircle className="h-4 w-4" /> {errors.otp.message}
                      </p>
                    )}
                    {otpStep === 'verify' && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        Code was sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{getValues('email')}</span>.
                      </p>
                    )}
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2.5 py-1 select-none">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 bg-white dark:bg-slate-950 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <Label htmlFor="remember" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                      Remember this device
                    </Label>
                  </div>
                </>
              )}

              {/* Submit Action Button */}
              <Button
                type="submit"
                disabled={
                  loading ||
                  (loginMode === 'password' && !isValid) ||
                  (loginMode === 'otp' && otpStep === 'request' && (!watchedEmail || !!errors.email)) ||
                  (loginMode === 'otp' && otpStep === 'verify' && (watchedOtp?.length !== 6 || !!errors.otp))
                }
                className="w-full bg-[#0a2540] hover:bg-[#001b33] active:bg-[#000f20] dark:bg-blue-600 dark:hover:bg-blue-500 dark:active:bg-blue-700 text-white font-bold h-11 rounded-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed mt-6 text-xs tracking-wide focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 outline-none"
              >
                {loading ? (
                  <>
                    <CircleNotch className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : loginMode === 'password' ? (
                  'Sign in'
                ) : otpStep === 'request' ? (
                  'Send Verification Code'
                ) : (
                  'Sign in with OTP'
                )}
              </Button>
            </form>

            {/* Bank Security Notice Badge */}
            <div className="flex items-center justify-center gap-2 mt-8 py-2.5 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800/40 select-none">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" weight="fill" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Your data is protected with enterprise-grade security
              </span>
            </div>
          </div>
        </section>

        {/* Right Pane - Visual Preview overlayed with live elements */}
        <section 
          className="hidden md:flex w-1/2 border-l border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden flex-col justify-between p-12 sm:p-14 select-none bg-[#090d16]"
          style={{ 
            backgroundImage: "url('/image1.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Transparent Overlay for high text contrast */}
          <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none" />

          {/* Top Row: Lock Icon badge */}
          <div className="flex justify-between items-start z-10 w-full">
            <div />
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white shadow-xl animate-in fade-in zoom-in duration-300">
              <Lock className="h-6 w-6" weight="fill" />
            </div>
          </div>

          {/* Middle Section: Heading and Dashboard Cards */}
          <div className="z-10 w-full mt-6 mb-8 flex flex-col justify-center">
            {/* Promotional Headings */}
            <div className="animate-in slide-in-from-top-4 duration-300">
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                Banking solutions<br />you can rely on
              </h2>
              <p className="text-slate-300 text-xs font-semibold mt-3 max-w-sm tracking-wide uppercase opacity-90">
                Secure. Intelligent. Reliable.<br />Built for a stronger tomorrow.
              </p>
            </div>

            {/* Glassmorphic Overlapping Dashboard Cards */}
            <div className="relative h-[250px] w-full mt-8">
              
              {/* Card 1: Key Insights (Total Disbursed) */}
              <div className="absolute top-0 left-0 w-[240px] bg-slate-900/60 hover:bg-slate-900/70 border border-white/10 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:scale-[1.02] cursor-default">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white/50 tracking-wider uppercase">Key Insights</span>
                  <DotsThree className="h-5 w-5 text-white/40 hover:text-white cursor-pointer" weight="bold" />
                </div>
                <span className="text-[10px] text-white/40 block mt-2 font-medium">Total Disbursed</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold tracking-tight">₹12.45 Cr</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <TrendUp className="h-2.5 w-2.5" /> 24.6%
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-1 rounded-full w-[70%]" />
                  </div>
                  <span className="text-[8px] text-white/30 mt-1.5 block">vs last month</span>
                </div>
              </div>

              {/* Card 2: Active Applications */}
              <div className="absolute top-10 right-0 w-[210px] bg-blue-600/80 hover:bg-blue-600/90 border border-white/10 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:scale-[1.02] z-10 flex items-start gap-3 cursor-default">
                <div className="p-2 bg-white/10 rounded-lg border border-white/10 text-white shadow-inner">
                  <FileText className="h-5 w-5 text-white" weight="fill" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-100/70 tracking-wider uppercase">Active Applications</span>
                  <div className="text-xl font-bold tracking-tight mt-0.5">1,248</div>
                  <span className="text-[8px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold mt-1 inline-block">Under Review</span>
                </div>
              </div>

              {/* Card 3: Approval Rate */}
              <div className="absolute bottom-0 left-6 w-[210px] bg-slate-900/60 hover:bg-slate-900/70 border border-white/10 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:scale-[1.02] flex items-start gap-3 cursor-default">
                <div className="p-2 bg-emerald-500/25 rounded-lg border border-emerald-500/30 text-emerald-400">
                  <TrendUp className="h-5 w-5" weight="bold" />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-white/50 tracking-wider uppercase block">Approval Rate</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold tracking-tight">78.4%</span>
                    <span className="text-[9px] text-emerald-400 font-bold">+8.2%</span>
                  </div>
                  <span className="text-[8px] text-white/30 block">vs last month</span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Row: Security Benefits */}
          <div className="z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 w-full">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="p-1.5 bg-white/5 group-hover:bg-white/10 rounded-lg border border-white/5 text-white/80 transition-all duration-200">
                <ShieldCheck className="h-4 w-4" weight="fill" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-wide uppercase">Enterprise Security</h4>
                <p className="text-[8px] text-white/40 font-medium">Bank-grade safety</p>
              </div>
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <div className="p-1.5 bg-white/5 group-hover:bg-white/10 rounded-lg border border-white/5 text-white/80 transition-all duration-200">
                <Key className="h-4 w-4" weight="fill" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-wide uppercase">Role Based</h4>
                <p className="text-[8px] text-white/40 font-medium">Granular access</p>
              </div>
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <div className="p-1.5 bg-white/5 group-hover:bg-white/10 rounded-lg border border-white/5 text-white/80 transition-all duration-200">
                <CheckCircle className="h-4 w-4" weight="fill" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-wide uppercase">Audit Trail</h4>
                <p className="text-[8px] text-white/40 font-medium">End-to-End tracking</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Global Semantic Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 border-t border-slate-200/50 dark:border-slate-800/40 pt-6 font-medium max-w-5xl w-full mx-auto select-none mt-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Fortress Lending Logo" className="h-5 w-auto opacity-70" />
          <span>© {new Date().getFullYear()} Fortress Lending. All rights reserved.</span>
        </div>
        <nav className="flex gap-4">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setAuthError("Terms are governed by corporate policy."); }} 
            className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          >
            About Us
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setAuthError("Blog portal is under construction."); }} 
            className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          >
            Blog
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setAuthError("License files are available inside target root directory."); }} 
            className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          >
            License
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setAuthError("Support desk is online during corporate hours."); }} 
            className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          >
            Support
          </a>
        </nav>
      </footer>
    </div>
  );
}
