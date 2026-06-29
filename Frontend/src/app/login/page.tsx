'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  CheckCircle,
  Lock,
  Envelope,
  Eye,
  EyeSlash,
  CircleNotch,
  ArrowLeft,
  WarningCircle,
  GoogleLogo,
  GithubLogo,
  Bag,
  Package,
  User,
  TrendUp
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

  const handleSocialClick = (platform: string) => {
    setAuthError(`Social login via ${platform} is disabled for secure terminal accounts.`);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] dark:bg-zinc-950 font-sans antialiased text-foreground justify-between p-4 sm:p-6 md:p-8">
      {/* Spacer / Top Nav mockup */}
      <div className="hidden sm:block" />

      {/* Main Split Container */}
      <div className="max-w-5xl w-full mx-auto bg-card text-card-foreground border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* Left Pane - Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-between bg-background">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-2 mb-8 select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/image.png" alt="Logo" className="w-auto h-auto object-contain" />
            </div>

            {/* Divider */}
            <div className="relative my-6 select-none">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground font-bold tracking-wide">
                  Welcome
                </span>
              </div>
            </div>

            {/* Inline Error Alert */}
            {authError && (
              <div className="p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-md text-xs font-semibold mb-4 flex items-start gap-2 animate-in fade-in duration-200">
                <WarningCircle className="h-4.5 w-4.5 shrink-0 text-destructive mt-0.5" weight="fill" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form Mode Tabs for Password / OTP */}
            {otpStep === 'request' && (
              <div className="flex p-0.5 bg-muted rounded-lg mb-5 border border-border">
                <button
                  type="button"
                  onClick={() => { setLoginMode('password'); setAuthError(null); }}
                  className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors cursor-pointer ${loginMode === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('otp'); setAuthError(null); }}
                  className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors cursor-pointer ${loginMode === 'otp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Email OTP
                </button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* PASSWORD MODE: Email & Password */}
              {loginMode === 'password' && (
                <>
                  {/* Email */}
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="email" className="text-xs font-bold text-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-9 bg-background border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-10 rounded font-medium text-xs shadow-sm"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] font-semibold text-destructive mt-1 flex items-center gap-1">
                        <WarningCircle className="h-3.5 w-3.5" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs font-bold text-foreground">
                        Password
                      </Label>
                      <a href="#" onClick={(e) => { e.preventDefault(); setAuthError("Please contact your IT administrator to reset your password."); }} className="text-[10px] text-muted-foreground font-semibold hover:underline">
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-9 pr-9 bg-background border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-10 rounded font-medium text-xs shadow-sm"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[10px] font-semibold text-destructive mt-1 flex items-center gap-1">
                        <WarningCircle className="h-3.5 w-3.5" /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2 py-1 select-none">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-3.5 h-3.5 rounded border border-border text-primary bg-background focus:ring-1 focus:ring-primary cursor-pointer accent-black"
                    />
                    <Label htmlFor="remember" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                      Remember this Device
                    </Label>
                  </div>
                </>
              )}

              {/* OTP MODE: Email and OTP code field underneath */}
              {loginMode === 'otp' && (
                <>
                  {/* Email (Always visible) */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="email" className="text-xs font-bold text-foreground">
                        Email
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
                          className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                        >
                          Change Email
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        disabled={otpStep === 'verify'}
                        className="pl-9 bg-background border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-10 rounded font-medium text-xs shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] font-semibold text-destructive mt-1 flex items-center gap-1">
                        <WarningCircle className="h-3.5 w-3.5" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* OTP Field (Visible at the bottom, disabled by default) */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="otp" className="text-xs font-bold text-foreground">
                        Verification Code
                      </Label>
                      {otpStep === 'verify' && (
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || loading}
                          onClick={handleResendOtp}
                          className="text-[10px] text-primary font-bold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP code"
                        disabled={otpStep === 'request'}
                        className="pl-9 bg-background border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-10 rounded font-mono text-xs tracking-widest shadow-sm disabled:opacity-50 disabled:bg-muted/30 disabled:cursor-not-allowed"
                        maxLength={6}
                        {...register('otp')}
                      />
                    </div>
                    {errors.otp && (
                      <p className="text-[10px] font-semibold text-destructive mt-1 flex items-center gap-1">
                        <WarningCircle className="h-3.5 w-3.5" /> {errors.otp.message}
                      </p>
                    )}
                    {otpStep === 'verify' && (
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">Code was sent to {getValues('email')}.</p>
                    )}
                  </div>
                   {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2 py-1 select-none">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-3.5 h-3.5 rounded border border-border text-primary bg-background focus:ring-1 focus:ring-primary cursor-pointer accent-black"
                    />
                    <Label htmlFor="remember" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                      Remember this Device
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
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold h-10 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-xs"
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
                  'Sign'
                )}
              </Button>
            </form>
          </div>

        </div>

        {/* Right Pane - Visual Preview */}
        <div className="hidden md:flex w-1/2 border-l border-border relative overflow-hidden flex-col justify-center select-none bg-[#090d16]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image1.png" alt="Dashboard Preview" className="w-full h-full object-cover" />
        </div>

      </div>

      {/* Global Page Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs text-muted-foreground border-t border-border/30 pt-6 font-medium max-w-5xl w-full mx-auto select-none mt-6">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" className="h-5 w-auto opacity-70" />
          <span>© {new Date().getFullYear()} Fortress Lending. All rights reserved.</span>
        </div>
        <div className="flex gap-4">
          <a href="#" onClick={(e) => { e.preventDefault(); setAuthError("Terms are governed by corporate policy."); }} className="hover:underline">About Us</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setAuthError("Blog portal is under construction."); }} className="hover:underline">Blog</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setAuthError("License files are available inside target root directory."); }} className="hover:underline">License</a>
        </div>
      </div>
    </div>
  );
}
