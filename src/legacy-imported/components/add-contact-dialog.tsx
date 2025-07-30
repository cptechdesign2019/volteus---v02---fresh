
'use client';

import { useState, type ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  customRole: z.string().optional(),
}).refine(data => {
    if (data.role === 'other' && !data.customRole) {
        return false;
    }
    return true;
}, {
    message: 'Please specify the custom role.',
    path: ['customRole'],
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface AddContactDialogProps {
  contact?: Contact;
  trigger: ReactNode;
  onSave: (contact: Contact) => void;
}

const predefinedRoles = [
    'Construction Manager',
    'Project Manager',
    'AV Manager',
    'IT Manager',
    'End User',
];

export function AddContactDialog({ contact, trigger, onSave }: AddContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!contact;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: '',
      customRole: '',
    },
  });

  useEffect(() => {
    if (isOpen && contact) {
      const isPredefinedRole = predefinedRoles.includes(contact.role || '');
      form.reset({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        role: isPredefinedRole ? contact.role : 'other',
        customRole: isPredefinedRole ? '' : contact.role,
      });
    } else if (isOpen && !contact) {
      form.reset();
    }
  }, [isOpen, contact, form]);
  
  const onSubmit = (data: ContactFormValues) => {
    const finalRole = data.role === 'other' ? data.customRole : data.role;
    const newContact: Contact = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: finalRole,
    };
    
    onSave(newContact);
    toast({
        title: isEditMode ? "Contact Updated" : "Contact Added",
        description: `${data.name} has been saved.`,
    });
    setIsOpen(false);
  };
  
  const watchRole = form.watch('role');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Contact' : 'Add Additional Contact'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for this contact." : "Enter the details for the new contact person."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Jane Doe" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="jane.d@example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input type="tel" {...field} placeholder="(555) 123-4567" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {predefinedRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                      <SelectItem value="other">Other (Please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchRole === 'other' && (
                <FormField
                    control={form.control}
                    name="customRole"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custom Role</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g., Office Manager" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}


            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Contact
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    