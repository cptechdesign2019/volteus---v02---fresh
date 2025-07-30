
// src/components/request-changes-dialog.tsx
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

interface RequestChangesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (comments: string) => Promise<void>;
}

export function RequestChangesDialog({ isOpen, onOpenChange, onConfirm }: RequestChangesDialogProps) {
  const [comments, setComments] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleConfirm = async () => {
    if (!comments.trim()) return;
    setIsSending(true);
    await onConfirm(comments);
    setComments(''); // Clear comments after successful submission
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Changes</DialogTitle>
          <DialogDescription>
            Please describe the changes you would like to make to this quote. Your request will be sent to our team for review.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="comments">Your comments</Label>
            <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Can we swap the TV for a larger model? Is it possible to add speakers to the patio area?"
                rows={6}
            />
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!comments.trim() || isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Request
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
