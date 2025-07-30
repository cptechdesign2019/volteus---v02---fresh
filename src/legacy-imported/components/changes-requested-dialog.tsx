// src/components/changes-requested-dialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';

interface ChangesRequestedDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (comments: string) => Promise<void>;
}

export function ChangesRequestedDialog({ isOpen, onOpenChange, onConfirm }: ChangesRequestedDialogProps) {
  const [comments, setComments] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleConfirm = async () => {
    if (!comments.trim()) return;
    setIsSending(true);
    await onConfirm(comments);
    setComments('');
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Customer-Requested Changes</DialogTitle>
          <DialogDescription>
            Enter the changes requested by the customer (e.g., from a phone call or email). This will be added to the quote's comment history and the status will be set to "Pending Changes".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="comments">Customer's requested changes</Label>
            <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Per phone call with Jane Doe, customer wants to add two more speakers to the main conference room and wants to know the price difference."
                rows={6}
            />
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!comments.trim() || isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
