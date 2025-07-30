// src/components/send-quote-dialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Quote, ChangeLogEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuotes } from '@/contexts/quote-context';
import { add } from 'date-fns';
import { generateDiffSummary } from '@/lib/diff';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const sendQuoteSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  cc: z.string().optional(),
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string().min(1, 'Email body is required.'),
  selectedOptions: z.array(z.string()).min(1, 'You must select at least one option to send.'),
  changeDescription: z.string().optional(),
});

type SendQuoteFormValues = z.infer<typeof sendQuoteSchema>;

interface SendQuoteDialogProps {
  quote: Quote | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isConfirmation?: boolean;
}

const NO_CHANGES_PLACEHOLDER = 'No changes were automatically detected. Please summarize your updates.';

export function SendQuoteDialog({ quote, isOpen, onOpenChange, isConfirmation = false }: SendQuoteDialogProps) {
  const { toast } = useToast();
  const { updateQuote } = useQuotes();
  const { user } = useAuth();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const form = useForm<SendQuoteFormValues>({
    resolver: zodResolver(sendQuoteSchema),
    defaultValues: {
      email: '',
      cc: '',
      subject: '',
      body: '',
      selectedOptions: [],
      changeDescription: '',
    },
  });
  
  const isResend = quote?.status === 'pending-changes';

  const diffSummary = useMemo(() => {
    if (isResend && quote && quote.originalOptionsForDiff && quote.originalOptionsForDiff.length > 0) {
      return generateDiffSummary(quote.originalOptionsForDiff, quote.options, quote.revisionNumber);
    }
    return '';
  }, [quote, isResend]);

  useEffect(() => {
    if (quote && isOpen) {
        const salesRepName = quote.salesRep || user?.displayName || 'The Clearpoint Team';
        const customerFirstName = quote.primaryContact.name?.split(' ')[0] || '';

        const defaultBody = isResend 
          ? `Hi ${customerFirstName}!\n\nYou can view your requested changes by clicking the button below to view the updated quote. Please let me know if you have any questions!\n\nThank you,\n${salesRepName}`
          : `Hi ${customerFirstName},\n\nThank you for giving us the opportunity to provide a quote for your technology project. You can view our proposal by clicking the button below.\n\nIf you would like to make any changes, you can easily do so by clicking the Request Changes button on the quote itself.\n\nWe look forward to hearing from you soon!\n\nThank you,\n${salesRepName}`;

        const ccEmails = (quote.additionalContacts || [])
          .map(contact => contact.email)
          .filter(email => typeof email === 'string' && email.length > 0)
          .join(', ');

        form.reset({
          email: quote.primaryContact.email || '',
          cc: ccEmails,
          subject: `Quote: ${quote.quoteNumber} - ${quote.quoteName}${isResend ? ` (Revision ${quote.revisionNumber})` : ''}`,
          body: defaultBody,
          selectedOptions: quote.options.map(o => o.id),
          changeDescription: diffSummary || '',
        });
    }
  }, [quote, form, isOpen, isResend, diffSummary, user]);

  const onSubmit = async (data: SendQuoteFormValues) => {
    if (!quote || !user || !app) return;

    setIsSending(true);

    try {
      // Get the callable function
      const functions = getFunctions(app, 'us-central1');
      const sendEmail = httpsCallable(functions, 'sendQuoteEmail');
      
      // Call the function with the payload
      await sendEmail({
          to: data.email,
          cc: data.cc,
          subject: data.subject,
          body: data.body,
          quoteId: quote.id,
          isConfirmation: false,
      });

      // Email sent successfully, now update the quote status
      const now = new Date();
      let expiresAt: Date | null = null;
      if (quote.expirationTimeline !== 'Never') {
          const days = parseInt(quote.expirationTimeline.split(' ')[0], 10);
          expiresAt = add(now, { days });
      }

      const originalOptions = quote.options;
      const optionsToSend = originalOptions.filter(opt => data.selectedOptions.includes(opt.id));
      
      const currentChangeLog = quote.changeLog || [];
      const updatePayload: Partial<Quote> = {
          options: optionsToSend,
          status: 'sent',
          originalOptionsForDiff: [], // Clear the diff snapshot after sending
      };

      if (isResend) {
          const changeDescriptionText = data.changeDescription?.trim();
          const description = changeDescriptionText && changeDescriptionText !== NO_CHANGES_PLACEHOLDER
              ? `Revision Sent (Rev ${quote.revisionNumber}):\n${changeDescriptionText}`
              : `Revision Sent (Rev ${quote.revisionNumber})`;
          const newChangeLogEntry: ChangeLogEntry = { timestamp: now.toISOString(), description, author: user.displayName || 'Clearpoint' };
          updatePayload.changeLog = [...currentChangeLog, newChangeLogEntry];
      } else {
          // This is the first send, so set sentAt
          updatePayload.sentAt = now.toISOString();
          updatePayload.expiresAt = expiresAt ? expiresAt.toISOString() : undefined;
      }
      
      await updateQuote(quote.id, updatePayload);
      
      toast({
        title: 'Email Sent',
        description: `The email has been successfully sent to ${data.email}.`,
      });
      onOpenChange(false);
      router.push('/quotes');

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.details?.message || error.message || 'An unknown error occurred while sending the quote.';
      toast({
        variant: 'destructive',
        title: 'Send Failed',
        description: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!quote) return null;

  const dialogTitle = isResend ? 'Send Updated Quote' : 'Send Quote to Customer';
  const dialogDescription = 'Customize the email and select which options to include. The customer will receive a link to a web version of the quote.';


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 rounded-lg bg-gradient-to-br from-muted/20 to-muted/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl><Input {...field} className="bg-background/80 border-border/60 shadow-inner" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC</FormLabel>
                      <FormControl><Input {...field} placeholder="Comma-separated emails" className="bg-background/80 border-border/60 shadow-inner" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl><Input {...field} className="bg-background/80 border-border/60 shadow-inner" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl><Textarea {...field} rows={8} className="bg-background/80 border-border/60 shadow-inner" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isResend && (
                <FormField
                  control={form.control}
                  name="changeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary of Changes (will be visible to customer)</FormLabel>
                      <FormControl><Textarea {...field} placeholder={NO_CHANGES_PLACEHOLDER} rows={5} className="bg-background/80 border-border/60 shadow-inner" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                  control={form.control}
                  name="selectedOptions"
                  render={() => (
                      <FormItem className="pt-2">
                          <div className="mb-2">
                              <FormLabel className="text-base">Quote Options to Include</FormLabel>
                          </div>
                          <div className="space-y-2">
                            {quote.options.map((option) => (
                                <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="selectedOptions"
                                    render={({ field }) => (
                                        <FormItem
                                            key={option.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(option.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...field.value, option.id])
                                                            : field.onChange(field.value?.filter((value) => value !== option.id))
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {option.name} - {formatCurrency(option.totals.finalPrice)}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                            ))}
                          </div>
                          <FormMessage />
                      </FormItem>
                  )}
              />
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSending ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
