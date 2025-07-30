
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  modelNumber: z.string().min(1, 'Model number is required'),
  brand: z.string().min(1, 'Please select or add a brand.'),
  newBrand: z.string().optional(),
  description: z.string().optional(),
  dealerCost: z.number().min(0, 'Dealer cost must be positive'),
  msrp: z.number().min(0, 'MSRP must be positive'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
}).refine(data => {
    if (data.brand === 'add_new_brand' && !data.newBrand) {
        return false;
    }
    return true;
}, {
    message: 'Please specify the new brand name.',
    path: ['newBrand'],
});

type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (product: Product) => Promise<void>;
  brands: string[];
}

export function AddProductDialog({ isOpen, onOpenChange, onSave, brands }: AddProductDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      modelNumber: '',
      brand: '',
      newBrand: '',
      description: '',
      dealerCost: 0,
      msrp: 0,
      imageUrl: '',
    },
  });
  
  const [localDealerCost, setLocalDealerCost] = useState('');
  const [localMsrp, setLocalMsrp] = useState('');

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setLocalDealerCost('');
      setLocalMsrp('');
    }
  }, [isOpen, form]);

  const onSubmit = async (data: ProductFormValues) => {
    const rawId = data.modelNumber;
    const sanitizedId = rawId.replace(/\//g, '-');
    
    const finalBrand = data.brand === 'add_new_brand' ? data.newBrand! : data.brand;

    const newProduct: Product = {
      id: sanitizedId,
      category: '',
      name: data.name,
      modelNumber: data.modelNumber,
      brand: finalBrand,
      description: data.description,
      dealerCost: parseFloat(localDealerCost) || 0,
      msrp: parseFloat(localMsrp) || 0,
      imageUrl: data.imageUrl || `https://placehold.co/100x100.png`,
    };
    await onSave(newProduct);
    onOpenChange(false);
  };
  
  const watchBrand = form.watch('brand');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product. It will be saved to your library and added to the quote.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input {...field} className="bg-background" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modelNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Number</FormLabel>
                    <FormControl><Input {...field} className="bg-background" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a brand" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="add_new_brand">Add New Brand...</SelectItem>
                                {brands.map(brand => (
                                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchBrand === 'add_new_brand' && (
                    <FormField
                        control={form.control}
                        name="newBrand"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Brand Name</FormLabel>
                                <FormControl><Input {...field} placeholder="Enter new brand name" className="bg-background" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} className="bg-background" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dealerCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dealer Cost</FormLabel>
                    <FormControl>
                        <Input 
                            type="text" 
                            value={localDealerCost} 
                            onChange={e => setLocalDealerCost(e.target.value)} 
                            onBlur={() => field.onChange(parseFloat(localDealerCost) || 0)}
                            className="bg-background" 
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="msrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MSRP</FormLabel>
                    <FormControl>
                        <Input 
                            type="text" 
                            value={localMsrp} 
                            onChange={e => setLocalMsrp(e.target.value)}
                            onBlur={() => field.onChange(parseFloat(localMsrp) || 0)}
                            className="bg-background"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input {...field} className="bg-background" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Add to Quote
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
