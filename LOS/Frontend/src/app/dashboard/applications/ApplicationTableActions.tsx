import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { DotsThree, Eye, Trash, Warning, Copy } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function ApplicationTableActions({ application, onActionComplete }: { application: any, onActionComplete: () => void }) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(application.applicationNumber);
    toast.success('Application number copied to clipboard.');
  };

  const handleDeleteClick = () => {
    toast.info("Compliance rules restrict deletion of active applications.");
    setActiveDialog(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground outline-none cursor-pointer">
          <span className="sr-only">Open menu</span>
          <DotsThree className="h-5 w-5" weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 shadow-lg ring-1 ring-border rounded-md">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/applications/${application.id}`)} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyNumber} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Copy App Number
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveDialog('delete')} className="text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer">
            <Trash className="mr-2 h-4 w-4" /> Delete Case
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}
      <Dialog open={activeDialog === 'delete'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="border-border bg-card shadow-2xl rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-foreground">Delete Application</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to delete application <span className="font-mono font-bold">{application.applicationNumber}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-md text-xs flex items-start gap-2 text-left mt-2">
            <Warning className="h-5 w-5 shrink-0" />
            <p>deleting credit origination entries requires supervisor overrides under current regulatory guidelines.</p>
          </div>
          <DialogFooter className="mt-4 border-t border-border pt-4">
            <Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted text-xs h-9 px-4 rounded-lg" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button type="button" variant="destructive" className="bg-destructive hover:bg-destructive/95 text-destructive-foreground text-xs h-9 px-4 rounded-lg" onClick={handleDeleteClick}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
