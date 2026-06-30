'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { UserTableActions } from './UserTableActions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Plus,
  CircleNotch,
  Users,
  ShieldCheck,
  Key,
  UserMinus,
  UserPlus,
  MagnifyingGlass,
  DownloadSimple,
  CaretLeft,
  CaretRight,
  Warning,
  CaretDown,
  UploadSimple,
  CaretUpDown,
  ArrowsCounterClockwise
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { BulkUpload } from '@/components/ui/bulk-upload';

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  role: z.enum(['SUPER_ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'APPROVER']),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side filtering & pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'LOAN_OFFICER',
    },
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users');
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Failed to fetch users.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: CreateUserFormValues) => {
    setSubmitting(true);
    try {
      const response = await api.post('/users', data);
      if (response.success) {
        toast.success('User account provisioned successfully.');
        setDialogOpen(false);
        reset();
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const rolesAssigned = new Set(users.map(u => u.role)).size;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter ? u.role === roleFilter : true;
      
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, limit]);

  const downloadCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Status', 'Created On'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => [
        `"${u.firstName}"`,
        `"${u.lastName}"`,
        u.email,
        u.role,
        u.isActive ? 'ACTIVE' : 'INACTIVE',
        new Date(u.createdAt).toISOString().split('T')[0]
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr) {
      case 'CUSTOMER':
        return <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Customer</span>;
      case 'APPROVER':
        return <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Approver</span>;
      case 'CREDIT_ANALYST':
        return <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Credit Analyst</span>;
      case 'LOAN_OFFICER':
        return <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Loan Officer</span>;
      case 'SUPER_ADMIN':
        return <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-350 dark:border-slate-700/50 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Super Admin</span>;
      default:
        return <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">{roleStr.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="space-y-6 w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="font-extrabold text-2xl text-foreground leading-snug flex items-center gap-2 tracking-tight">
            User Administration
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Configure terminal users and allocate credit roles.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-border bg-card text-foreground cursor-pointer shadow-sm h-10 px-4 transition-all duration-150 font-bold" onClick={downloadCSV}>
            <DownloadSimple className="h-4 w-4 mr-2" weight="bold" />
            Export CSV
          </Button>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                reset();
              }
            }}
          >
            <DialogTrigger
              render={
                <Button className="bg-primary hover:bg-primary/95 hover:text-primary-foreground text-primary-foreground font-bold flex items-center gap-2 cursor-pointer h-10 px-4 rounded transition-all duration-150 shadow">
                  <Plus className="h-4 w-4" weight="bold" />
                  Add User
                </Button>
              }
            />
            <DialogContent className="p-0 gap-0 sm:max-w-lg overflow-hidden border-border bg-card shadow-2xl sm:rounded-lg">
              <div className="bg-muted/30 px-6 py-6 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm text-primary">
                    <UserPlus className="h-6 w-6" weight="bold" />
                  </div>
                  <div className="text-left">
                    <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">Create Terminal Account</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs mt-1 leading-relaxed font-medium">
                      Register a new administrator, loan officer, risk analyst, or approver account.
                    </DialogDescription>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="firstName" className="text-xs font-bold text-foreground/90">First Name</Label>
                      <Input
                        id="firstName"
                        className="h-10 bg-background border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground transition-all rounded"
                        placeholder="John"
                        {...register('firstName')}
                      />
                      {errors.firstName && <p className="text-xs text-destructive font-semibold">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="lastName" className="text-xs font-bold text-foreground/90">Last Name</Label>
                      <Input
                        id="lastName"
                        className="h-10 bg-background border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground transition-all rounded"
                        placeholder="Doe"
                        {...register('lastName')}
                      />
                      {errors.lastName && <p className="text-xs text-destructive font-semibold">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="email" className="text-xs font-bold text-foreground/90">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-10 bg-background border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground/60 transition-all rounded"
                      placeholder="user@los.com"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-xs text-destructive font-semibold">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="password" className="text-xs font-bold text-foreground/90">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-10 bg-background border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground transition-all rounded"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    {errors.password && <p className="text-xs text-destructive font-semibold">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="role" className="text-xs font-bold text-foreground/90">Security Role</Label>
                    <div className="relative">
                      <select
                        id="role"
                        className="w-full h-10 px-3 rounded bg-background border border-border text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm font-semibold cursor-pointer shadow-sm transition-all appearance-none"
                        {...register('role')}
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        <option value="LOAN_OFFICER">LOAN OFFICER (RM)</option>
                        <option value="CREDIT_ANALYST">CREDIT ANALYST (Risk)</option>
                        <option value="APPROVER">APPROVER (Executive)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                        <CaretDown className="h-4 w-4" />
                      </div>
                    </div>
                    {errors.role && <p className="text-xs text-destructive font-semibold">{errors.role.message}</p>}
                  </div>
                </div>

                <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center h-10 px-8 rounded shadow cursor-pointer transition-all duration-200"
                  >
                    {submitting ? (
                      <>
                        <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                        Saving User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4.5 w-4.5" weight="bold" />
                        Provision Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Block matching the exact layout of the screenshot */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3.5 shadow-sm transition-colors duration-200 select-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Users</span>
              <span className="font-extrabold text-3xl text-foreground mt-0.5 leading-none">{totalUsers}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            All system users
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3.5 shadow-sm transition-colors duration-200 select-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0">
              <ShieldCheck className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Active Users</span>
              <span className="font-extrabold text-3xl text-emerald-605 mt-0.5 leading-none">{activeUsers}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Currently active users
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3.5 shadow-sm transition-colors duration-200 select-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
              <Key className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Roles Assigned</span>
              <span className="font-extrabold text-3xl text-amber-600 mt-0.5 leading-none">{rolesAssigned}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Total roles allocated
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3.5 shadow-sm transition-colors duration-200 select-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 shrink-0">
              <UserMinus className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Inactive Users</span>
              <span className="font-extrabold text-3xl text-rose-600 mt-0.5 leading-none">{inactiveUsers}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Disabled or inactive users
          </p>
        </div>
      </div>

      {/* Bulk Upload Component */}
      <BulkUpload type="users" onSuccess={fetchUsers} open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} />

      {/* Table Card matching screenshot exactly */}
      <Card className="border-border bg-card text-foreground shadow-sm transition-colors duration-200 overflow-hidden">
        <CardHeader className="px-4 border-b border-border bg-muted/20">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Search by name, email or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-background border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="w-full lg:w-56 space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Filter</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                <option value="LOAN_OFFICER">LOAN OFFICER</option>
                <option value="CREDIT_ANALYST">CREDIT ANALYST</option>
                <option value="APPROVER">APPROVER</option>
              </select>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="border-border text-slate-700 dark:text-slate-300 hover:bg-muted cursor-pointer h-9 shadow-sm font-bold flex items-center gap-1.5 rounded-lg px-4 text-xs"
              >
                <ArrowsCounterClockwise className="h-4 w-4" weight="bold" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkDialogOpen(true)}
                className="border-border text-slate-700 dark:text-slate-300 hover:bg-muted cursor-pointer h-9 shadow-sm font-bold flex items-center gap-1.5 rounded-lg px-4 text-xs"
              >
                <UploadSimple className="h-4 w-4" weight="bold" />
                Bulk Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <div>
          {error && (
            <div className="p-4 text-sm text-destructive font-semibold text-center bg-destructive/10 border-b border-border flex items-center justify-center gap-2">
              <Warning className="h-4.5 w-4.5 text-destructive" weight="fill" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-6">
                    <div className="flex items-center gap-1">
                      Name
                      <CaretUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-6">
                    <div className="flex items-center gap-1">
                      Email
                      <CaretUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-6">
                    <div className="flex items-center gap-1">
                      Role
                      <CaretUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-6">
                    <div className="flex items-center gap-1">
                      Status
                      <CaretUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-6">
                    <div className="flex items-center gap-1">
                      Created On
                      <CaretUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-b border-border">
                      <TableCell className="py-4 px-6"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-4 w-48 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-6 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-6 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-8 w-8 ml-auto bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No users found</h3>
                        <p className="text-sm mt-1 max-w-sm font-medium">No accounts match your current filter criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors duration-150 group">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs uppercase border border-primary/20">
                            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                          </div>
                          <span className="font-bold text-foreground text-sm">
                            {item.firstName} {item.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs py-4 px-6 text-left">{item.email}</TableCell>
                      <TableCell className="py-4 px-6 text-left">
                        {getRoleBadge(item.role)}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-left">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border tracking-wide ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-500'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono py-4 px-6 font-medium text-left">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end">
                          <UserTableActions user={item} onActionComplete={fetchUsers} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination & Limits */}
          <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                Rows per page
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm font-semibold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3 font-bold text-xs rounded-lg"
              >
                <CaretLeft className="h-4 w-4 mr-1" weight="bold" />
                Previous
              </Button>
              <div className="flex items-center justify-center px-3.5 text-xs font-bold border border-border rounded-lg bg-background shadow-sm h-8 min-w-[32px]">
                {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3 font-bold text-xs rounded-lg"
              >
                Next
                <CaretRight className="h-4 w-4 ml-1" weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
