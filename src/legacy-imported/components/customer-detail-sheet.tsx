

'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Home,
  Building,
  Mail,
  Phone,
  User,
  MapPin,
  FileText,
  Briefcase,
  PlusCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { CustomerInfo, Quote, Contact, Address } from '@/lib/types';
import { CustomerFormDialog } from './customer-form-dialog';
import { AddContactDialog } from './add-contact-dialog';
import Link from 'next/link';
import { useQuotes } from '@/contexts/quote-context';
import { useToast } from '@/hooks/use-toast';


interface CustomerDetailSheetProps {
  customer: CustomerInfo | null;
  quotes: Quote[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const InfoBlock = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || 'N/A'}</p>
    </div>
  </div>
);

const formatAddress = (address?: Address) => {
    if (!address) return null;
    const parts = [
        address.street1,
        address.street2,
        `${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''} ${address.zip || ''}`.trim()
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
};


const ContactCard = ({ contact, onEdit, onDelete }: { contact: Contact, onEdit: (contact: Contact) => void, onDelete: () => void }) => (
  <Card className="bg-muted/50">
    <CardHeader className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div>
                <CardTitle className="text-base font-medium">
                    {contact.name || 'Unnamed Contact'}
                </CardTitle>
                {contact.role && <Badge variant="secondary" className="mt-1">{contact.role}</Badge>}
            </div>
        </div>
        <div className="flex items-center">
            <AddContactDialog
              contact={contact}
              onSave={onEdit}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the contact "{contact.name}". This cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-3 pt-0 space-y-2 text-sm pl-11">
        {contact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a></div>}
        {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a></div>}
    </CardContent>
  </Card>
);


export function CustomerDetailSheet({
  customer: initialCustomer,
  quotes,
  isOpen,
  onOpenChange,
}: CustomerDetailSheetProps) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(initialCustomer);
  const { updateCustomer } = useQuotes();
  const { toast } = useToast();

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  const persistContactChanges = async (updatedCustomer: CustomerInfo) => {
    if (!customer) return;
    try {
        await updateCustomer(customer.id, {
            additionalContacts: updatedCustomer.additionalContacts,
        });
        toast({
            title: "Contacts Updated",
            description: "Additional contacts have been saved.",
        });
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Could not save changes",
            description: "There was an error updating contacts."
        });
    }
  }

  const handleAddContact = async (contact: Contact) => {
    if (!customer) return;
    const updatedCustomer = {
        ...customer,
        additionalContacts: [...(customer.additionalContacts || []), contact]
    };
    setCustomer(updatedCustomer);
    await persistContactChanges(updatedCustomer);
  };
  
  const handleEditContact = async (index: number, updatedContact: Contact) => {
    if (!customer) return;
    const newContacts = [...(customer.additionalContacts || [])];
    newContacts[index] = updatedContact;
    const updatedCustomer = { ...customer, additionalContacts: newContacts };
    setCustomer(updatedCustomer);
    await persistContactChanges(updatedCustomer);
  };

  const handleDeleteContact = async (index: number) => {
    if (!customer) return;
    const newContacts = [...(customer.additionalContacts || [])];
    newContacts.splice(index, 1);
    const updatedCustomer = { ...customer, additionalContacts: newContacts };
    setCustomer(updatedCustomer);
    await persistContactChanges(updatedCustomer);
  };


  if (!customer) {
    return null;
  }

  const mainAddress = formatAddress(customer.billingAddress);
  
  const sheetTitle = customer.projectType === 'Commercial'
    ? customer.companyName
    : customer.primaryContact.name;


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            {customer.projectType === 'Commercial' ? (
                <Building className="h-6 w-6 text-primary" />
            ) : (
                <Home className="h-6 w-6 text-primary" />
            )}
            <div>
                <SheetTitle className="text-2xl font-light">{sheetTitle}</SheetTitle>
                <SheetDescription>
                    {customer.projectType} Customer
                </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Customer Details</CardTitle>
                <CustomerFormDialog customer={customer} trigger={
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4"/>
                    Edit
                  </Button>
                }/>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6">
                 <InfoBlock icon={User} label="Primary Contact" value={customer.primaryContact.name} />
                 <InfoBlock icon={Phone} label="Primary Phone" value={customer.primaryContact.phone} />
                 <InfoBlock icon={Mail} label="Primary Email" value={customer.primaryContact.email} />
                 <InfoBlock icon={MapPin} label="Billing Address" value={mainAddress || undefined} />
              </CardContent>
            </Card>
            
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Additional Contacts</CardTitle>
                 <AddContactDialog onSave={handleAddContact} trigger={
                  <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button>
                 } />
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.additionalContacts && customer.additionalContacts.length > 0 ? (
                    customer.additionalContacts.map((contact, index) => (
                        <ContactCard
                          key={index}
                          contact={contact}
                          onEdit={(updatedContact) => handleEditContact(index, updatedContact)}
                          onDelete={() => handleDeleteContact(index)}
                        />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No additional contacts.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quotes</CardTitle>
                <CardDescription>A list of all quotes associated with this customer.</CardDescription>
              </CardHeader>
              <CardContent>
                {quotes.length > 0 ? (
                  <ul className="space-y-3">
                    {quotes.map(quote => {
                        const projectAddress = quote.useBillingForProject ? quote.billingAddress : quote.projectAddress;
                        const formattedAddress = formatAddress(projectAddress);

                        return (
                        <li key={quote.id} className="text-sm p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                            <Link href={`/quotes/build/${quote.id}`} className="block">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {quote.quoteNumber} - {quote.quoteName}</span>
                                    <Badge variant={quote.status === 'accepted' ? 'default' : 'secondary'} className="capitalize">{quote.status}</Badge>
                                </div>
                                {formattedAddress && (
                                    <div className="flex items-start gap-2 mt-2 pl-6 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 mt-0.5" />
                                        <span>{formattedAddress}</span>
                                    </div>
                                )}
                            </Link>
                        </li>
                        )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No quotes found for this customer.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                     <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                     <p>Project management features are coming soon.</p>
                  </div>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
