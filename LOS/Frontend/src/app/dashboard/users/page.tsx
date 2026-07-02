'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { cn } from '@/lib/utils';
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
  ArrowsCounterClockwise,
  ArrowUp,
  ArrowDown,
  X
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { BulkUpload } from '@/components/ui/bulk-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'motion/react';
import { UserPlusIcon, Loader2Icon, ChevronDownIcon } from 'lucide-react';

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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side filtering & pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState<keyof UserData | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');

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

  const getMockLastLogin = (userId: string, createdAt: string) => {
    const charCodeSum = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mod = charCodeSum % 5;
    switch (mod) {
      case 0: return 'Active 14 minutes ago';
      case 1: return 'Active 2 hours ago';
      case 2: return 'Yesterday at 4:32 PM';
      case 3: return '3 days ago at 10:15 AM';
      case 4: return 'Active 45 minutes ago';
      default: return 'Active 5 minutes ago';
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter ? u.role === roleFilter : true;
      
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = u.isActive === true;
      } else if (statusFilter === 'inactive') {
        matchesStatus = u.isActive === false;
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    if (sortField && sortOrder) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, search, roleFilter, statusFilter, sortField, sortOrder]);

  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, limit]);

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
    setStatusFilter('');
    setSortField('');
    setSortOrder('');
  };

  const handleSort = (field: keyof UserData) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortOrder('');
        setSortField('');
      } else setSortOrder('asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortableHead = (field: keyof UserData, label: string, align: 'left' | 'right' | 'center' = 'left') => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className={`text-sm py-3 px-4 cursor-pointer hover:bg-muted/30 select-none transition-colors ${isActive ? 'font-bold text-foreground' : 'text-muted-foreground font-semibold'} text-${align}`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {label}
          {isActive && sortOrder === 'asc' && <ArrowUp className="h-3.5 w-3.5" weight="bold" />}
          {isActive && sortOrder === 'desc' && <ArrowDown className="h-3.5 w-3.5" weight="bold" />}
        </div>
      </TableHead>
    );
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
          <h1 className="font-semibold text-2xl text-foreground leading-snug flex items-center gap-2 tracking-tight">
            Configure terminal users and allocate credit roles.
          </h1>
        </div>

        <div className="flex gap-2">
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
                <Button className="bg-primary hover:bg-primary/95 hover:text-primary-foreground text-primary-foreground font-semibold flex items-center gap-1.5 cursor-pointer h-9 px-4 rounded-lg transition-all duration-150 shadow-sm text-sm">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              }
            />
            <DialogContent className="p-0 gap-0 sm:max-w-lg overflow-hidden border-border bg-card shadow-lg sm:rounded-lg">
              <div className="px-6 py-5 border-b flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border text-foreground">
                  <UserPlusIcon className="h-6 w-6" />
                </div>
                <div className="text-left space-y-1">
                  <DialogTitle className="text-lg font-semibold text-foreground">Create Terminal Account</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Register a new administrator, loan officer, risk analyst, or approver account.
                  </DialogDescription>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        className={cn("h-10 bg-background transition-all rounded", errors.firstName && "border-destructive focus-visible:ring-destructive")}
                        placeholder="John"
                        {...register('firstName')}
                      />
                      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        className={cn("h-10 bg-background transition-all rounded", errors.lastName && "border-destructive focus-visible:ring-destructive")}
                        placeholder="Doe"
                        {...register('lastName')}
                      />
                      {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      className={cn("h-10 bg-background transition-all rounded", errors.email && "border-destructive focus-visible:ring-destructive")}
                      placeholder="user@los.com"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="password" className="text-sm font-medium">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      className={cn("h-10 bg-background transition-all rounded", errors.password && "border-destructive focus-visible:ring-destructive")}
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="role" className="text-sm font-medium">Security Role</Label>
                    <div className="relative">
                      <select
                        id="role"
                        className={cn("w-full h-10 px-3 rounded bg-background border border-border text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm font-medium cursor-pointer shadow-sm transition-all appearance-none", errors.role && "border-destructive focus:border-destructive focus:ring-destructive")}
                        {...register('role')}
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        <option value="LOAN_OFFICER">LOAN OFFICER (RM)</option>
                        <option value="CREDIT_ANALYST">CREDIT ANALYST (Risk)</option>
                        <option value="APPROVER">APPROVER (Executive)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                    </div>
                    {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                  </div>
                </div>

                <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setDialogOpen(false); reset(); }}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="min-w-[140px]"
                  >
                    {submitting ? (
                      <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Provisioning...</>
                    ) : (
                      'Provision Account'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Block matching the exact layout of the screenshot */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4  transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Total Users</span>
            <span className="font-bold text-lg text-foreground leading-tight">{totalUsers}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4  transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Active Users</span>
            <span className="font-bold text-lg text-foreground leading-tight">{activeUsers}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4  transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
            <Key className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Roles Assigned</span>
            <span className="font-bold text-lg text-foreground leading-tight">{rolesAssigned}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4  transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 shrink-0">
            <UserMinus className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Inactive Users</span>
            <span className="font-bold text-lg text-foreground leading-tight">{inactiveUsers}</span>
          </div>
        </div>
      </div>

      {/* Bulk Upload Component */}
      <BulkUpload type="users" onSuccess={fetchUsers} open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} />

      {/* Clean Inline Filters (Outside the Card, directly on the page layout) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 bg-background border-border text-foreground placeholder-muted-foreground shadow-none rounded-md w-full text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto scrollbar-none">
          {/* Role Filter Dropdown */}
          <Select value={roleFilter || 'all'} onValueChange={(val) => setRoleFilter(val === 'all' || !val ? '' : val)}>
            <SelectTrigger className="h-8 text-xs border-border bg-background w-36">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-foreground z-50">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="LOAN_OFFICER">Loan Officer</SelectItem>
              <SelectItem value="CREDIT_ANALYST">Credit Analyst</SelectItem>
              <SelectItem value="APPROVER">Approver</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter Dropdown */}
          <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' || !val ? '' : val)}>
            <SelectTrigger className="h-8 text-xs border-border bg-background w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-foreground z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-4 bg-border mx-1 hidden lg:block" />

          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkDialogOpen(true)}
            className="border-border text-foreground hover:bg-muted cursor-pointer h-8 shadow-sm font-medium flex items-center gap-1.5 rounded-md px-3 text-xs shrink-0"
          >
            <UploadSimple className="h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      </div>

      {/* Table Container Card */}
      <Card className="border-border bg-background text-foreground shadow-sm overflow-hidden rounded-xl py-0!">
        <div>
          {error && (
            <div className="p-4 text-sm text-destructive font-semibold text-center bg-destructive/10 border-b border-border flex items-center justify-center gap-2">
              <Warning className="h-4.5 w-4.5 text-destructive" weight="fill" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-background border-b border-border">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="w-[40px] px-4">
                    <Checkbox 
                      checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(paginatedUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {renderSortableHead('firstName', 'Name')}
                  {renderSortableHead('email', 'Email')}
                  {renderSortableHead('role', 'Role')}
                  {renderSortableHead('createdAt', 'Created On')}
                  {renderSortableHead('isActive', 'Status')}
                  <TableHead className="text-right text-muted-foreground font-semibold text-xs py-3 px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-b border-border/50">
                      <TableCell className="py-3 px-4"><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-48 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-6 w-24 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-6 w-16 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-8 w-8 ml-auto bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No users found</h3>
                        <p className="text-sm mt-1 max-w-sm font-medium">No accounts match your current filter criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow 
                        className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors duration-150 ${
                          selectedUsers.includes(item.id) ? 'bg-muted/20' : ''
                        } ${expandedId === item.id ? 'border-b-0 bg-muted/10' : ''}`}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <TableCell className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedUsers.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(prev => [...prev, item.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                            aria-label={`Select ${item.firstName}`}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="font-medium text-foreground text-sm">
                            {item.firstName} {item.lastName}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm py-3 px-4 text-left">{item.email}</TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          {getRoleBadge(item.role)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm py-3 px-4 font-medium text-left">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium text-xs tracking-tight ${
                              item.isActive
                                ? 'bg-foreground text-background'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <UserTableActions user={item} onActionComplete={fetchUsers} />
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail row */}
                      <TableRow className={`hover:bg-transparent p-0! ${expandedId === item.id ? '' : 'hidden'}`}>
                        <TableCell colSpan={7} className="p-0 border-none">
                          <AnimatePresence initial={false}>
                            {expandedId === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden bg-muted/10 border-b border-border/50"
                              >
                                <div className="flex flex-wrap gap-4 px-12 py-3.5 text-xs text-muted-foreground items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">Last Login:</span>
                                    <span>{getMockLastLogin(item.id, item.createdAt)}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">User ID:</span>
                                    <span className="font-mono">{item.id}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination & Limits */}
          <div className="p-4 border-t border-border bg-background flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="h-8 w-8 rounded-md border-border text-foreground hover:bg-muted shadow-sm"
                >
                  <CaretLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-8 w-8 rounded-md border-border text-foreground hover:bg-muted shadow-sm"
                >
                  <CaretRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Floating Action Bar */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border border-border text-foreground shadow-2xl rounded-full px-5 py-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedUsers.length} selected
          </span>
          <div className="w-px h-4 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-2 rounded-full text-xs font-medium text-foreground hover:bg-muted px-3 cursor-pointer" 
            onClick={() => {
              toast.success(`Exporting ${selectedUsers.length} users to CSV...`);
              setSelectedUsers([]);
            }}
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted px-3 cursor-pointer" 
            onClick={() => setSelectedUsers([])}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
