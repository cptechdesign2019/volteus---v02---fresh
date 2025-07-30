
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuoteOption } from '@/lib/types';

interface AddOptionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  options: QuoteOption[];
  onAdd: (sourceOptionId?: string) => void;
}

export function AddOptionDialog({ isOpen, onOpenChange, options, onAdd }: AddOptionDialogProps) {
  const [creationType, setCreationType] = useState<'blank' | 'copy'>('blank');
  const [sourceOptionId, setSourceOptionId] = useState<string | undefined>(options[0]?.id);

  const handleCreate = () => {
    if (creationType === 'blank') {
      onAdd();
    } else {
      onAdd(sourceOptionId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Option</DialogTitle>
          <DialogDescription>
            Create a blank new option or copy the equipment list from an existing option.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <RadioGroup value={creationType} onValueChange={(value: 'blank' | 'copy') => setCreationType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="blank" id="r1" />
              <Label htmlFor="r1">Create a blank new option</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="copy" id="r2" />
              <Label htmlFor="r2">Copy an existing option</Label>
            </div>
          </RadioGroup>
          {creationType === 'copy' && (
            <div className="pl-6 pt-2">
              <Label>Copy from</Label>
              <Select value={sourceOptionId} onValueChange={setSourceOptionId}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select an option to copy" />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Option</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
