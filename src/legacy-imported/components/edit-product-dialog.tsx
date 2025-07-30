
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

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  modelNumber: z.string().min(1, 'Model number is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().optional(),
  dealerCost: z.number().min(0, 'Dealer cost must be positive'),
  msrp: z.number().min(0, 'MSRP must be positive'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface EditProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (productId: string, data: Partial<Product>) => Promise<void>;
}

export function EditProductDialog({ product, isOpen, onOpenChange, onSave }: EditProductDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      modelNumber: '',
      brand: '',
      description: '',
      dealerCost: 0,
      msrp: 0,
      imageUrl: '',
    },
  });

  const [localDealerCost, setLocalDealerCost] = useState('');
  const [localMsrp, setLocalMsrp] = useState('');

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        modelNumber: product.modelNumber,
        brand: product.brand,
        description: product.description || '',
        dealerCost: product.dealerCost,
        msrp: product.msrp,
        imageUrl: product.imageUrl || '',
      });
      setLocalDealerCost(product.dealerCost.toString());
      setLocalMsrp(product.msrp.toString());
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!product) return;
    await onSave(product.id, {
        ...data,
        dealerCost: parseFloat(localDealerCost) || 0,
        msrp: parseFloat(localMsrp) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to the product details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {product && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modelNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
