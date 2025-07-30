// src/components/new-quote-form.tsx
'use client';

import type { ChangeEvent } from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuotes } from '@/contexts/quote-context';
import type { Quote, CustomerInfo, QuoteOption } from '@/lib/types';
import { salesReps, salesAssistants } from '@/data/sales-team';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, ArrowRight, AlertTriangle, Loader2, Save, ChevronsUpDown, Check } from 'lucide-react';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

const addressSchema = z.object({
  street1: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

const formSchema = z.object({
  quoteName: z.string().min(1, 'Quote name is required'),
  customerType: z.enum(['new', 'existing']),
  customerId: z.string().optional(),
  salesRep: z.string().optional(),
  salesAssistant: z.string().optional(),
  projectType: z.enum(['Residential', 'Commercial']),
  companyName: z.string().optional(),
  primaryContact: z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  billingAddress: addressSchema,
  useBillingForProject: z.boolean().default(true),
  projectAddress: addressSchema,
  additionalContacts: z.array(z.object({
    name: z.string().optional(),
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    phone: z.string().optional(),
  })),
  expirationTimeline: z.enum(['Never', '30 Days', '60 Days', '90 Days']),
});

type FormValues = z.infer<typeof formSchema>;
type AddressType = 'billingAddress' | 'projectAddress';


const AddressFields = ({ form, addressType }: { form: UseFormReturn<FormValues>, addressType: AddressType }) => {
    const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handlePlaceSelect = () => {
        const place = autoCompleteRef.current?.getPlace();
        if (!place || !place.address_components) return;

        const getAddressComponent = (type: string) => {
            return place.address_components?.find(component => component.types.includes(type))?.long_name || '';
        };

        const streetNumber = getAddressComponent('street_number');
        const route = getAddressComponent('route');
        
        form.setValue(`${addressType}.street1`, `${streetNumber} ${route}`.trim(), { shouldValidate: true });
        form.setValue(`${addressType}.city`, getAddressComponent('locality'), { shouldValidate: true });
        form.setValue(`${addressType}.state`, getAddressComponent('administrative_area_level_1'), { shouldValidate: true });
        form.setValue(`${addressType}.zip`, getAddressComponent('postal_code'), { shouldValidate: true });
    };

    useEffect(() => {
      if (window.google && inputRef.current) {
          autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
              componentRestrictions: { country: 'us' },
              fields: ['address_components'],
              types: ['address'],
          });
          autoCompleteRef.current.addListener('place_changed', handlePlaceSelect);
      }
      return () => {
          if (autoCompleteRef.current) {
              window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
          }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <FormField
                control={form.control}
                name={`${addressType}.street1`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="123 Main St"
                                {...field}
                                ref={(e) => {
                                    field.ref(e);
                                    if(e) inputRef.current = e;
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name={`${addressType}.street2`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl><Input placeholder="Apt, suite, etc. (optional)" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name={`${addressType}.city`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input placeholder="Anytown" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`${addressType}.state`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl><Input placeholder="CA" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`${addressType}.zip`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ZIP / Postal Code</FormLabel>
                            <FormControl><Input placeholder="12345" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </>
    );
};


export function NewQuoteForm({ quote }: { quote?: Quote }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicateId');
  const { addQuote, updateQuote, getNewQuoteNumber, getQuote, customers, updateCustomer, loading: quotesLoading } = useQuotes();
  const [quoteName, setQuoteName] = useState(quote?.quoteName || '');
  const [isMapsKeyMissing, setIsMapsKeyMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopulating, setIsPopulating] = useState(true);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  
  const isEditMode = !!quote;
  const isDuplicateMode = !!duplicateId;

  const displayQuoteNumber = useMemo(() => {
    if (isEditMode) return quote.quoteNumber;
    const nextNum = getNewQuoteNumber();
    return quoteName ? `${nextNum} - ${quoteName}` : nextNum;
  }, [quoteName, getNewQuoteNumber, isEditMode, quote]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setIsMapsKeyMissing(true);
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quoteName: '',
      customerType: 'new',
      customerId: '',
      salesRep: '',
      salesAssistant: '',
      projectType: 'Commercial',
      companyName: '',
      primaryContact: { name: '', email: '', phone: '' },
      billingAddress: { street1: '', street2: '', city: '', state: '', zip: '' },
      useBillingForProject: true,
      projectAddress: { street1: '', street2: '', city: '', state: '', zip: '' },
      additionalContacts: [],
      expirationTimeline: '30 Days',
    },
  });
  
  const populateFormWithQuoteData = useCallback((quoteData: Quote) => {
      const isDuplicating = isDuplicateMode && !isEditMode;
      const customer = customers.find(c => c.id === quoteData.customerId);
      
      const newFormValues = {
        quoteName: isDuplicating ? `${quoteData.quoteName} (Copy)` : quoteData.quoteName,
        customerType: customer ? 'existing' : 'new',
        customerId: quoteData.customerId,
        salesRep: quoteData.salesRep || '',
        salesAssistant: quoteData.salesAssistant || '',
        projectType: customer?.projectType || quoteData.projectType,
        companyName: customer?.companyName || quoteData.companyName || '',
        primaryContact: customer?.primaryContact || quoteData.primaryContact,
        billingAddress: customer?.billingAddress || quoteData.billingAddress,
        useBillingForProject: quoteData.useBillingForProject,
        projectAddress: quoteData.projectAddress,
        additionalContacts: quoteData.additionalContacts || [],
        expirationTimeline: quoteData.expirationTimeline || '30 Days',
      };
      
      form.reset(newFormValues);
      setQuoteName(newFormValues.quoteName);
      
      // Force re-validation to ensure UI updates for dependent fields
      form.trigger();
  }, [form, isDuplicateMode, isEditMode, customers]);

  useEffect(() => {
    // Wait until customer data is loaded before trying to populate
    if (quotesLoading) {
        setIsPopulating(true);
        return;
    }

    let sourceQuote: Quote | undefined;
    if (isEditMode && quote) {
      sourceQuote = quote;
    } else if (isDuplicateMode) {
      sourceQuote = getQuote(duplicateId);
    }

    if (sourceQuote) {
      populateFormWithQuoteData(sourceQuote);
    }
    
    setIsPopulating(false);

  }, [isEditMode, quote, isDuplicateMode, duplicateId, getQuote, populateFormWithQuoteData, quotesLoading]);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalContacts",
  });

  const watchCustomerType = form.watch('customerType');
  const watchUseBilling = form.watch('useBillingForProject');
  const watchProjectType = form.watch('projectType');
  const watchCustomerId = form.watch('customerId');

  useEffect(() => {
    if (watchCustomerType === 'new') {
        form.setValue('customerId', undefined);
    }
  }, [watchCustomerType, form]);

  useEffect(() => {
    // When customerId changes (from dropdown), repopulate customer fields
    if (watchCustomerType === 'existing' && watchCustomerId) {
      const customer = customers.find(c => c.id === watchCustomerId);
      if (customer) {
        form.setValue('companyName', customer.companyName || '');
        form.setValue('primaryContact', customer.primaryContact || { name: '', email: '', phone: '' });
        form.setValue('billingAddress', customer.billingAddress || { street1: '', street2: '', city: '', state: '', zip: '' });
        
        const billingStr = JSON.stringify(customer.billingAddress);
        const projectStr = JSON.stringify(customer.projectAddress);
        const useBilling = billingStr === projectStr;
        
        form.setValue('useBillingForProject', useBilling);

        if (!useBilling) {
            form.setValue('projectAddress', customer.projectAddress);
        }
        
        form.setValue('projectType', customer.projectType);
      }
    }
  }, [watchCustomerId, watchCustomerType, customers, form]);


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && quote) {
        
        // 1. Prepare and update the Customer document
        const displayName = data.projectType === 'Commercial' && data.companyName 
            ? data.companyName 
            : data.primaryContact.name || 'Unnamed Customer';

        const customerUpdates: Partial<CustomerInfo> = {
            displayName,
            companyName: data.companyName,
            projectType: data.projectType,
            primaryContact: data.primaryContact,
            billingAddress: data.billingAddress,
            projectAddress: data.useBillingForProject ? data.billingAddress : data.projectAddress,
        };
        await updateCustomer(quote.customerId, customerUpdates);


        // 2. Prepare and update the Quote document
        // We only pass the fields that belong to the quote schema itself
        const quoteUpdates: Partial<Quote> = {
            quoteName: data.quoteName,
            salesRep: data.salesRep,
            salesAssistant: data.salesAssistant,
            customerType: data.customerType,
            projectType: data.projectType,
            customerTypeForPricing: data.projectType,
            companyName: data.companyName,
            primaryContact: data.primaryContact,
            billingAddress: data.billingAddress,
            useBillingForProject: data.useBillingForProject,
            projectAddress: data.projectAddress,
            additionalContacts: data.additionalContacts,
            expirationTimeline: data.expirationTimeline,
        };
        await updateQuote(quote.id, quoteUpdates);
        
        router.push('/quotes');

      } else {
        const sourceQuote = isDuplicateMode ? getQuote(duplicateId) : undefined;
        
        const quotePayload: Partial<Quote> = {
            ...data,
            quoteNumber: getNewQuoteNumber(),
            customerTypeForPricing: data.projectType,
            customerId: data.customerType === 'existing' ? data.customerId : undefined,
            options: sourceQuote?.options ? JSON.parse(JSON.stringify(sourceQuote.options)) as QuoteOption[] : undefined,
            subcontractors: sourceQuote?.subcontractors,
        };

        const customerPayload: Partial<CustomerInfo> = {
            projectType: data.projectType,
            companyName: data.companyName,
            primaryContact: data.primaryContact,
            billingAddress: data.billingAddress,
            projectAddress: data.useBillingForProject ? data.billingAddress : data.projectAddress
        };
        const newQuote = await addQuote(quotePayload, customerPayload);
        router.push(`/quotes/build/${newQuote.id}`);
      }
    } catch (error) {
        console.error("Failed to save quote", error);
        // You might want to show a toast or an alert here
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    if (rawValue.length > 0) {
      formattedValue = '(' + rawValue.substring(0, 3);
    }
    if (rawValue.length >= 4) {
      formattedValue += ') ' + rawValue.substring(3, 6);
    }
    if (rawValue.length >= 7) {
      formattedValue += '-' + rawValue.substring(6, 10);
    }
    fieldOnChange(formattedValue);
  };
  
  if (isPopulating) {
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto">
        {isMapsKeyMissing && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Needed</AlertTitle>
                <AlertDescription>
                   Address autocomplete is disabled. Please provide a <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.
                </AlertDescription>
            </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Quote Details' : 'Quote Details'}</CardTitle>
            <CardDescription>{isEditMode ? 'Update the details for this quote.' : 'Start by giving your quote a name.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="quoteName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quote Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Main Conference Room AV" {...field} onChange={(e) => {
                        field.onChange(e);
                        setQuoteName(e.target.value);
                        }}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="space-y-2">
                <Label htmlFor="quoteNumber">Quote Number</Label>
                <Input id="quoteNumber" value={displayQuoteNumber} disabled />
                </div>
            </div>
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="salesRep"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Sales Rep</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Assign a sales rep" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {salesReps.map(rep => (
                                    <SelectItem key={rep.name} value={rep.name}>{rep.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="salesAssistant"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Sales Assistant</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Assign an assistant" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {salesAssistants.map(assist => (
                                    <SelectItem key={assist.name} value={assist.name}>{assist.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            <div>
                 <FormField
                    control={form.control}
                    name="expirationTimeline"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Expires In</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Set expiration timeline" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="30 Days">30 Days</SelectItem>
                                <SelectItem value="60 Days">60 Days</SelectItem>
                                <SelectItem value="90 Days">90 Days</SelectItem>
                                <SelectItem value="Never">Never</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select an existing customer or add a new one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select customer type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="new">New Customer</SelectItem>
                            <SelectItem value="existing" disabled={customers.length === 0}>
                                Existing Customer {customers.length === 0 ? '(None available)' : ''}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Residential">Residential</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            {watchCustomerType === 'existing' && (
               <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Select Customer</FormLabel>
                            <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? customers.find(c => c.id === field.value)?.displayName
                                                : "Select customer"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search customers..." />
                                        <CommandEmpty>No customer found.</CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        value={customer.displayName}
                                                        key={customer.id}
                                                        onSelect={() => {
                                                            form.setValue('customerId', customer.id, { shouldDirty: true });
                                                            setIsCustomerPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                customer.id === field.value ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {customer.displayName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
          
            {watchProjectType === 'Commercial' && (
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input placeholder="ABC Corporation" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />
            <p className="text-sm font-medium">Primary Contact</p>
             <div className="grid md:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="primaryContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
                 <FormField
                  control={form.control}
                  name="primaryContact.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
                 <FormField
                    control={form.control}
                    name="primaryContact.phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="(555) 123-4567" {...field} onChange={e => handlePhoneChange(e, field.onChange)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressFields form={form} addressType="billingAddress" />
          </CardContent>
        </Card>
      
        <Card>
          <CardHeader>
            <CardTitle>Project Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
                control={form.control}
                name="useBillingForProject"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Project address is the same as billing address</FormLabel>
                        </div>
                    </FormItem>
                )}
            />
            {!watchUseBilling && (
                 <div className="space-y-4 pt-4 border-t">
                    <AddressFields form={form} addressType="projectAddress" />
                </div>
            )}
          </CardContent>
        </Card>
      
         <Card>
          <CardHeader>
            <CardTitle>Additional Contacts</CardTitle>
             <CardDescription>Add other points of contact for this project if needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
               <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                  <p className="text-sm font-medium text-muted-foreground">Additional Contact</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`additionalContacts.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="Jane Smith" {...field}/></FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`additionalContacts.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="jane.smith@example.com" {...field}/></FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`additionalContacts.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input type="tel" placeholder="(555) 987-6543" {...field} onChange={e => handlePhoneChange(e, field.onChange)}/></FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', email: '', phone: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
              {isEditMode ? (
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <>
                  <Button variant="outline" type="button" disabled>Save as Draft</Button>
                  <Button type="submit" disabled={!form.formState.isValid || isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Saving...' : 'Save & Continue to Builder'}
                  </Button>
                </>
              )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
