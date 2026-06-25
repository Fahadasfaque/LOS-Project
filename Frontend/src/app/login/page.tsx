'use client';

import React, { useState } from 'react';
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
  GitBranch,
  BarChart2,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Access granted to terminal!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans antialiased">
      {/* Left Column - Infrastructure Stats & Info */}
      <div className="hidden lg:flex lg:w-5/12 shrink-0 flex-col justify-between bg-[#0d1533] p-12 text-white border-r border-white/5">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-md bg-[#2563eb] flex items-center justify-center shadow-lg shadow-[#2563eb]/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg leading-tight">Fortress Lending</div>
              <div className="text-[#6b7a9e] text-[10px] tracking-widest uppercase font-bold">
                Loan Origination System
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-white text-3.5xl xl:text-4xl font-bold leading-tight mb-5">
            Enterprise-grade <br />
            <span className="text-[#2563eb]">credit infrastructure</span> <br />
            for modern lenders.
          </h1>
          <p className="text-[#6b7a9e] text-sm xl:text-base leading-relaxed max-w-sm mb-12">
            Streamline origination, decisioning, and compliance from a single secure terminal.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-4 mb-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#1e3a8a]/40 flex items-center justify-center shrink-0">
                <GitBranch className="h-4 w-4 text-[#2563eb]" />
              </div>
              <span className="text-sm text-slate-200 font-medium">Automated underwriting &amp; decisioning</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#1e3a8a]/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-[#2563eb]" />
              </div>
              <span className="text-sm text-slate-200 font-medium">Bank-grade security &amp; audit trails</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#1e3a8a]/40 flex items-center justify-center shrink-0">
                <BarChart2 className="h-4 w-4 text-[#2563eb]" />
              </div>
              <span className="text-sm text-slate-200 font-medium">Real-time portfolio analytics</span>
            </div>
          </div>
        </div>

        {/* Footer info & compliance */}
        <div>
          <div className="border-t border-white/10 pt-8 mb-8 grid grid-cols-3 gap-4">
            <div>
              <div className="text-white font-bold text-xl xl:text-2xl font-mono">$4.2B</div>
              <div className="text-[#6b7a9e] text-xs mt-1">Loans Originated</div>
            </div>
            <div>
              <div className="text-white font-bold text-xl xl:text-2xl font-mono">99.98%</div>
              <div className="text-[#6b7a9e] text-xs mt-1">System Uptime</div>
            </div>
            <div>
              <div className="text-white font-bold text-xl xl:text-2xl font-mono">3,200+</div>
              <div className="text-[#6b7a9e] text-xs mt-1">Active Partners</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 border border-white/10 rounded px-2.5 py-1 bg-white/5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2563eb]" />
              <span className="text-[10px] text-slate-300 font-semibold font-mono">SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-1.5 border border-white/10 rounded px-2.5 py-1 bg-white/5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2563eb]" />
              <span className="text-[10px] text-slate-300 font-semibold font-mono">ISO 27001</span>
            </div>
            <div className="flex items-center gap-1.5 border border-white/10 rounded px-2.5 py-1 bg-white/5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2563eb]" />
              <span className="text-[10px] text-slate-300 font-semibold font-mono">PCI DSS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Terminal Login Panel */}
      <div className="flex-1 flex flex-col justify-between bg-white p-8 lg:p-12 min-h-screen">
        {/* Secure connection header */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2 text-xs text-[#6b7a9e] font-mono">
            <Lock className="h-3.5 w-3.5 text-[#6b7a9e]" />
            <span>Secure connection</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] inline-block ml-1 animate-pulse"></span>
            <span className="text-[#2563eb] font-semibold">TLS 1.3</span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-col justify-center flex-1 max-w-sm mx-auto w-full py-8">
          <div className="mb-8">
            <h2 className="text-[#0a0f1e] text-3xl font-bold mb-2">Sign in</h2>
            <p className="text-[#6b7a9e] text-sm">
              Enter your credentials to access the credit terminal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-[#0a0f1e]">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a9e]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 bg-[#f4f6fb] border-[#e2e6ef] text-[#0a0f1e] placeholder-[#6b7a9e] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb] h-11 rounded-lg font-medium"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-[#0a0f1e]">
                  Password
                </Label>
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Please contact your IT administrator to reset your password."); }} className="text-xs text-[#2563eb] font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a9e]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-[#f4f6fb] border-[#e2e6ef] text-[#0a0f1e] placeholder-[#6b7a9e] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb] h-11 rounded-lg font-medium"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7a9e] hover:text-[#0a0f1e] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-[#e2e6ef] text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-[#6b7a9e] cursor-pointer select-none font-medium">
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-11 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Access Terminal'
              )}
            </Button>
          </form>
        </div>

        {/* Footer copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6b7a9e] border-t border-[#e2e6ef] pt-6 font-medium">
          <div>© 2026 Fortress Lending Technologies Inc.</div>
          <div className="flex gap-4">
            <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Privacy Policy is governed by corporate compliance."); }} className="hover:underline">Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Terms of Service is governed by corporate compliance."); }} className="hover:underline">Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Support portal is available inside the terminal."); }} className="hover:underline">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
