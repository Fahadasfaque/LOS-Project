import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, ShieldAlert, Key, Power, PowerOff, Trash, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export function UserTableActions({ user, onActionComplete }: { user: any, onActionComplete: () => void }) {
  const { user: currentUser } = useAuth();
  
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  
  // States for Edit User
  const [editForm, setEditForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    department: user.department || '',
  });

  // State for Change Role
  const [newRole, setNewRole] = useState(user.role);

  // State for Reset Password
  const [newPassword, setNewPassword] = useState('');

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${user.id}`, editForm);
      toast.success('User updated successfully.');
      setActiveDialog(null);
      onActionComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user.');
    }
  };

  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${user.id}/role`, { role: newRole });
      toast.success('User role changed successfully.');
      setActiveDialog(null);
      onActionComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${user.id}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setActiveDialog(null);
      setNewPassword('');
      onActionComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
      setActiveDialog(null);
      onActionComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deleted successfully.');
      setActiveDialog(null);
      onActionComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  // RBAC checks
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground outline-none">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setActiveDialog('view')}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </DropdownMenuItem>
          {isSuperAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveDialog('edit')}>
                <Edit className="mr-2 h-4 w-4" /> Edit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog('role')}>
                <ShieldAlert className="mr-2 h-4 w-4" /> Change Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog('password')}>
                <Key className="mr-2 h-4 w-4" /> Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog('status')}>
                {user.isActive ? <PowerOff className="mr-2 h-4 w-4 text-rose-500" /> : <Power className="mr-2 h-4 w-4 text-emerald-500" />} 
                {user.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveDialog('delete')} className="text-rose-600 focus:text-rose-600">
                <Trash className="mr-2 h-4 w-4" /> Delete User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Profile Dialog */}
      <Dialog open={activeDialog === 'view'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View user details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium text-sm">Name:</span>
              <span className="col-span-3 text-sm">{user.firstName} {user.lastName}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium text-sm">Email:</span>
              <span className="col-span-3 text-sm">{user.email}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium text-sm">Phone:</span>
              <span className="col-span-3 text-sm">{user.phone || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium text-sm">Role:</span>
              <span className="col-span-3 text-sm">{user.role}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium text-sm">Department:</span>
              <span className="col-span-3 text-sm">{user.department || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium text-sm">Status:</span>
              <span className="col-span-3 text-sm">{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={activeDialog === 'edit'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user personal details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={activeDialog === 'role'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>Update the system role for this user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeRoleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                <option value="LOAN_OFFICER">LOAN OFFICER</option>
                <option value="CREDIT_ANALYST">CREDIT ANALYST</option>
                <option value="APPROVER">APPROVER</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button type="submit">Update Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={activeDialog === 'password'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for this user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button type="submit">Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={activeDialog === 'status'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.isActive ? 'Deactivate User' : 'Activate User'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {user.isActive ? 'deactivate' : 'activate'} this user account?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {user.isActive && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input id="reason" placeholder="Enter reason for deactivation" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button type="button" variant={user.isActive ? "destructive" : "default"} onClick={handleToggleStatus}>
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={activeDialog === 'delete'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you absolutely sure? This action cannot be undone and will permanently delete the user account.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-md text-sm flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>Ensure the user has no active dependencies (like pending loan applications) before deleting.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
