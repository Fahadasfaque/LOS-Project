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
  Loader2,
  Users,
  ShieldCheck,
  KeyRound,
  UserX,
  UserPlus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

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
        u.lastName.toLowerCase().includes(search.toLowerCase());
      
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground leading-snug flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Administration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure terminal users and allocate credit roles.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-border bg-card text-foreground cursor-pointer shadow-sm h-10 px-4 transition-all duration-150" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
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
                <Button className="bg-card hover:text-white text-foreground font-semibold flex items-center gap-2 cursor-pointer h-10 px-4 rounded-md transition-all duration-150 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              }
            />
            <DialogContent className="p-0 gap-0 sm:max-w-lg overflow-hidden border-border bg-card shadow-2xl sm:rounded-2xl">
              <div className="bg-muted/30 px-6 py-6 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Create Terminal Account</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm mt-1 leading-relaxed">
                      Register a new administrator, loan officer, risk analyst, or approver account.
                    </DialogDescription>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-foreground/90">First Name</Label>
                      <Input
                        id="firstName"
                        className="h-11 bg-muted/20 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground/60 transition-all rounded-lg shadow-sm"
                        placeholder="John"
                        {...register('firstName')}
                      />
                      {errors.firstName && <p className="text-xs text-rose-500 font-medium">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-foreground/90">Last Name</Label>
                      <Input
                        id="lastName"
                        className="h-11 bg-muted/20 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground/60 transition-all rounded-lg shadow-sm"
                        placeholder="Doe"
                        {...register('lastName')}
                      />
                      {errors.lastName && <p className="text-xs text-rose-500 font-medium">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground/90">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-11 bg-muted/20 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground/60 transition-all rounded-lg shadow-sm"
                      placeholder="user@los.com"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground/90">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-11 bg-muted/20 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground/60 transition-all rounded-lg shadow-sm"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    {errors.password && <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-sm font-semibold text-foreground/90">Security Role</Label>
                    <div className="relative">
                      <select
                        id="role"
                        className="w-full h-11 px-3 rounded-lg bg-muted/20 border border-border/60 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm cursor-pointer shadow-sm transition-all appearance-none"
                        {...register('role')}
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        <option value="LOAN_OFFICER">LOAN OFFICER (RM)</option>
                        <option value="CREDIT_ANALYST">CREDIT ANALYST (Risk)</option>
                        <option value="APPROVER">APPROVER (Executive)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                    {errors.role && <p className="text-xs text-rose-500 font-medium">{errors.role.message}</p>}
                  </div>
                </div>

                <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center h-11 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
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

      {/* KPI Stats Block */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4 flex-1 transition-colors duration-200 shadow-sm">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Total Users
            </div>
            <div className="text-foreground text-2xl font-bold leading-tight mt-0.5">
              {totalUsers}
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4 flex-1 transition-colors duration-200 shadow-sm">
          <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Active Users
            </div>
            <div className="text-foreground text-2xl font-bold leading-tight mt-0.5">
              {activeUsers}
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4 flex-1 transition-colors duration-200 shadow-sm">
          <div className="w-10 h-10 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Roles Assigned
            </div>
            <div className="text-foreground text-2xl font-bold leading-tight mt-0.5">
              {rolesAssigned}
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4 flex-1 transition-colors duration-200 shadow-sm">
          <div className="w-10 h-10 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 shrink-0">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Inactive Users
            </div>
            <div className="text-foreground text-2xl font-bold leading-tight mt-0.5">
              {inactiveUsers}
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border bg-card text-foreground shadow-sm transition-colors duration-200 overflow-hidden">
        <CardHeader className="px-4 border-b border-border bg-muted/20">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Search by name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-card border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground shadow-sm"
                />
              </div>
            </div>

            <div className="w-full lg:w-56 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role Filter</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
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
                className="border-border text-foreground hover:bg-muted cursor-pointer h-9 shadow-sm"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-sm text-rose-600 font-medium text-center bg-rose-50 border-b border-border flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 px-6">Name</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 px-6">Email</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 px-6">Role</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 px-6">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 px-6">Created On</TableHead>
                  <TableHead className="text-right text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 px-6">Actions</TableHead>
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
                        <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No users found</h3>
                        <p className="text-sm mt-1 max-w-sm">No accounts match your current filter criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors duration-150 group">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs uppercase border border-primary/20">
                            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                          </div>
                          <span className="font-semibold text-foreground text-sm">
                            {item.firstName} {item.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs py-4 px-6">{item.email}</TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-[11px] bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-md font-mono font-semibold tracking-wide">
                          {item.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border tracking-wide ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-500'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-500'
                          }`}
                        >
                          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono py-4 px-6">
                        {new Date(item.createdAt).toLocaleDateString()}
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
          <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                Rows per page
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center justify-center px-3 text-sm font-medium border border-border rounded-md bg-card shadow-sm h-8">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
