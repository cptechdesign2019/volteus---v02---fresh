
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, PlusCircle, Pencil, GripVertical, Copy, Info } from 'lucide-react';
import type { Product, QuoteItem, QuoteArea, Quote } from '@/lib/types';
import { useProducts } from '@/contexts/product-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from './ui/label';
import { Separator } from '@/components/ui/separator';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AddProductDialog } from './add-product-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};


interface SortableTableRowProps {
  item: QuoteItem;
  onUpdateItemQuantity: (quantity: number) => void;
  onUpdateSellPrice: (sellPrice: number | undefined) => void;
  onDeleteItem: () => void;
  onDuplicate: () => void;
  isEditable: boolean;
}
const SortableTableRow = ({ item, onUpdateItemQuantity, onUpdateSellPrice, onDeleteItem, onDuplicate, isEditable }: SortableTableRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, disabled: !isEditable });
    
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 10 : 0,
        position: 'relative',
        background: isDragging ? 'hsl(var(--muted))' : 'transparent',
    };
    
    const sellPrice = item.sellPriceOverride ?? item.msrp;
    const markup = useMemo(() => (item.dealerCost > 0 ? ((sellPrice / item.dealerCost) - 1) * 100 : 0), [sellPrice, item.dealerCost]);
    
    const [displayMarkup, setDisplayMarkup] = useState('');
    const [displaySellPrice, setDisplaySellPrice] = useState('');
    const [displayQuantity, setDisplayQuantity] = useState('');
    
    useEffect(() => {
        const newSellPrice = item.sellPriceOverride ?? item.msrp;
        const newMarkup = item.dealerCost > 0 ? ((newSellPrice / item.dealerCost) - 1) * 100 : 0;
        setDisplaySellPrice(newSellPrice.toFixed(2));
        setDisplayMarkup(newMarkup.toFixed(0));
        setDisplayQuantity(item.quantity.toString());
    }, [item.sellPriceOverride, item.msrp, item.dealerCost, item.quantity]);


    const persistMarkupChange = () => {
        const newMarkup = parseFloat(displayMarkup);
        if (isNaN(newMarkup) || newMarkup < 0) {
            const currentMarkup = item.dealerCost > 0 ? (((item.sellPriceOverride ?? item.msrp) / item.dealerCost) - 1) * 100 : 0;
            setDisplayMarkup(currentMarkup.toFixed(0));
            return;
        }

        const currentMarkup = item.dealerCost > 0 ? (((item.sellPriceOverride ?? item.msrp) / item.dealerCost) - 1) * 100 : 0;
        if (Math.abs(newMarkup - currentMarkup) < 1) { 
            onUpdateSellPrice(undefined);
        } else if (item.dealerCost > 0) {
            const newSellPrice = item.dealerCost * (1 + newMarkup / 100);
            onUpdateSellPrice(newSellPrice);
        }
    };
    
    const persistSellPriceChange = () => {
        const newSellPrice = parseFloat(displaySellPrice);
        if (isNaN(newSellPrice) || newSellPrice < 0) {
            setDisplaySellPrice((item.sellPriceOverride ?? item.msrp).toFixed(2));
            return;
        }

        if (Math.abs(newSellPrice - item.msrp) < 0.01) {
            onUpdateSellPrice(undefined);
        } else {
            onUpdateSellPrice(newSellPrice);
        }
    };

    const persistQuantityChange = () => {
        const newQuantity = parseInt(displayQuantity, 10);
        if (isNaN(newQuantity) || newQuantity < 0) {
            setDisplayQuantity(item.quantity.toString());
        } else if (newQuantity !== item.quantity) {
            onUpdateItemQuantity(newQuantity);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            const newSellPrice = item.sellPriceOverride ?? item.msrp;
            const newMarkup = item.dealerCost > 0 ? ((newSellPrice / item.dealerCost) - 1) * 100 : 0;
            setDisplaySellPrice(newSellPrice.toFixed(2));
            setDisplayMarkup(newMarkup.toFixed(0));
            setDisplayQuantity(item.quantity.toString());
            (e.target as HTMLInputElement).blur();
        }
    };

    const lineTotal = sellPrice * item.quantity;
    
    return (
        <TableRow ref={setNodeRef} style={style} {...attributes} data-dragging={isDragging} className="text-xs">
             <TableCell className="w-[40px] py-1 px-2 text-center" >
                <div {...listeners} className={isEditable ? "cursor-grab p-1" : "p-1"}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            </TableCell>
            <TableCell className="py-1 px-2 text-center">
                <img alt={item.name} className="aspect-square rounded-md object-contain bg-muted h-8 w-8 mx-auto" src={item.imageUrl} data-ai-hint="product image" />
            </TableCell>
            <TableCell className="font-medium py-1 px-2 text-center">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] mx-auto">{item.name}</p>
                        </TooltipTrigger>
                        <TooltipContent><p>{item.name}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
            <TableCell className="py-1 px-2 text-center">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] mx-auto">{item.modelNumber}</p>
                        </TooltipTrigger>
                        <TooltipContent><p>{item.modelNumber}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
            <TableCell className="py-1 px-2 text-center">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px] mx-auto">{item.description}</p>
                        </TooltipTrigger>
                        <TooltipContent><p className="max-w-sm">{item.description}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
            <TableCell className="text-center py-1 px-2">{formatCurrency(item.dealerCost)}</TableCell>
            <TableCell className="w-[120px] py-1 px-2 text-center">
              <div className="relative w-20 mx-auto">
                <Input
                  type="text"
                  value={displayMarkup}
                  onChange={(e) => setDisplayMarkup(e.target.value)}
                  onBlur={persistMarkupChange}
                  onKeyDown={handleKeyDown}
                  onFocus={e => e.target.select()}
                  className="text-center pr-5 h-7"
                  disabled={item.dealerCost <= 0 || !isEditable}
                />
                <span className="absolute inset-y-0 right-1.5 flex items-center text-muted-foreground text-xs">%</span>
              </div>
            </TableCell>
            <TableCell className="text-center py-1 px-2">{formatCurrency(item.msrp)}</TableCell>
            <TableCell className="w-[120px] py-1 px-2 text-center">
              <div className="relative w-24 mx-auto">
                <span className="absolute inset-y-0 left-2 flex items-center text-muted-foreground text-xs">$</span>
                <Input
                  type="text"
                  value={displaySellPrice}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDisplaySellPrice(e.target.value)}
                  onBlur={persistSellPriceChange}
                  onKeyDown={handleKeyDown}
                  className="text-center px-5 h-7"
                  disabled={!isEditable}
                />
              </div>
            </TableCell>
            <TableCell className="py-1 px-2 text-center">
                <Input 
                    type="text" 
                    value={displayQuantity} 
                    onChange={e => setDisplayQuantity(e.target.value)}
                    onBlur={persistQuantityChange}
                    onKeyDown={handleKeyDown}
                    onFocus={e => e.target.select()}
                    className="w-16 mx-auto text-center h-7" 
                    disabled={!isEditable}
                />
            </TableCell>
            <TableCell className="text-center font-semibold py-1 px-2">{formatCurrency(lineTotal)}</TableCell>
            <TableCell className="text-center py-1 px-2">
                <div className="flex items-center justify-center">
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} disabled={!isEditable}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Duplicate Item</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDeleteItem} disabled={!isEditable}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Item</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </TableCell>
        </TableRow>
    );
};


interface AreaCardProps {
    area: QuoteArea;
    onUpdateAreaName: (name: string) => void;
    onDeleteItem: (itemId: string) => void;
    onUpdateItemQuantity: (itemId: string, quantity: number) => void;
    onUpdateItemSellPrice: (itemId: string, sellPrice: number | undefined) => void;
    onUpdateItemsOrder: (items: QuoteItem[]) => void;
    onDuplicateItem: (item: QuoteItem) => void;
    onDeleteArea: (areaId: string) => void;
    disabledDelete: boolean;
    isEditable: boolean;
    onApplyAreaMarkup: (markup: number) => void;
}

const AreaCard = ({ area, onUpdateAreaName, onDeleteItem, onUpdateItemQuantity, onUpdateItemSellPrice, onUpdateItemsOrder, onDuplicateItem, onDeleteArea, disabledDelete, isEditable, onApplyAreaMarkup }: AreaCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [globalMarkup, setGlobalMarkup] = useState('');
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        if (!isEditable) return;
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = area.items.findIndex((item) => item.id === active.id);
            const newIndex = area.items.findIndex((item) => item.id === over.id);
            onUpdateItemsOrder(arrayMove(area.items, oldIndex, newIndex));
        }
    };
    
    const areaTotals = useMemo(() => {
        const cost = area.items.reduce((acc, item) => acc + item.dealerCost * item.quantity, 0);
        const sellPrice = area.items.reduce((acc, item) => {
            const itemSellPrice = item.sellPriceOverride ?? item.msrp;
            return acc + (itemSellPrice * item.quantity);
        }, 0);
        const profit = sellPrice - cost;
        const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
        return { cost, sellPrice, profit, margin };
    }, [area.items]);

    const gpmColorStyle = useMemo(() => {
        const margin = areaTotals.margin;
        const clampedMargin = Math.max(0, Math.min(margin, 40));
        const hue = (clampedMargin / 40) * 120; // 0% is red (0), 40% is green (120)
        return { color: `hsl(${hue}, 90%, 45%)` };
    }, [areaTotals.margin]);

    const handleApplyMarkup = () => {
        const markup = parseFloat(globalMarkup);
        if (!isNaN(markup) && markup >= 0) {
            onApplyAreaMarkup(markup);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <Input
                            value={area.name}
                            onChange={(e) => onUpdateAreaName(e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    e.preventDefault();
                                    setIsEditing(false);
                                }
                            }}
                            autoFocus
                            className="font-headline font-light text-2xl h-auto p-1 border-primary bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-sm shadow-none"
                            placeholder="Enter Area Name"
                            disabled={!isEditable}
                        />
                    ) : (
                        <>
                            <CardTitle className="font-headline font-light text-2xl">{area.name}</CardTitle>
                             {isEditable && (
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-6 w-6 text-muted-foreground hover:text-primary">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
                 {isEditable && (
                    <Button variant="ghost" size="icon" onClick={() => onDeleteArea(area.id)} disabled={disabledDelete}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[40px] py-2 px-2 text-center text-primary"></TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Image</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Product Name</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Model Number</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Description</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Cost</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Markup</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">MSRP</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Sell Price</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Qty</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Line Total</TableHead>
                                <TableHead className="py-2 px-2 text-center text-primary">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <SortableContext items={area.items.map(i => i.id)} strategy={verticalListSortingStrategy} disabled={!isEditable}>
                                <TableBody>
                                    {area.items.length > 0 ? area.items.map(item => (
                                       <SortableTableRow 
                                            key={item.id}
                                            item={item}
                                            onUpdateItemQuantity={(quantity) => onUpdateItemQuantity(item.id, quantity)}
                                            onUpdateSellPrice={(sellPrice) => onUpdateItemSellPrice(item.id, sellPrice)}
                                            onDeleteItem={() => onDeleteItem(item.id)}
                                            onDuplicate={() => onDuplicateItem(item)}
                                            isEditable={isEditable}
                                       />
                                    )) : (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center text-muted-foreground h-24">No equipment added to this area yet. Use the search above to add products.</TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                            </SortableContext>
                        </Table>
                    </div>
                </DndContext>
            </CardContent>
            <CardFooter className="flex justify-end p-4">
              <div className="w-full max-w-sm space-y-2 text-sm p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-base mb-4 text-center">Equipment Summary</h4>
                   <div className="flex justify-between items-center">
                        <Label htmlFor={`global-markup-${area.id}`}>Global Markup</Label>
                        <div className="flex items-center gap-1">
                            <div className="relative w-24">
                                <Input
                                    id={`global-markup-${area.id}`}
                                    type="text"
                                    value={globalMarkup}
                                    onChange={(e) => setGlobalMarkup(e.target.value)}
                                    className="h-8 text-center pr-6"
                                    disabled={!isEditable}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyMarkup() }}
                                />
                                <span className="absolute inset-y-0 right-2 flex items-center text-muted-foreground text-xs">%</span>
                            </div>
                            <Button onClick={handleApplyMarkup} size="sm" className="h-8" disabled={!isEditable}>Apply</Button>
                        </div>
                   </div>
                   <Separator />
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Customer Price</span>
                      <span className="font-semibold text-base">{formatCurrency(areaTotals.sellPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Company Cost</span>
                      <span>{formatCurrency(areaTotals.cost)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="font-semibold">{formatCurrency(areaTotals.profit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">GP Margin %</span>
                      <span className="font-semibold" style={gpmColorStyle}>
                          {areaTotals.margin.toFixed(2)}%
                      </span>
                  </div>
              </div>
            </CardFooter>
        </Card>
    )
}

interface DuplicateItemDialogProps {
    item: QuoteItem | null;
    areas: QuoteArea[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (destinationAreaId: string, quantity: number) => void;
}

function DuplicateItemDialog({ item, areas, isOpen, onOpenChange, onConfirm }: DuplicateItemDialogProps) {
    const [destinationAreaId, setDestinationAreaId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);

    useEffect(() => {
        if (item) {
            setQuantity(item.quantity);
            if (areas.length > 0) {
              setDestinationAreaId(areas[0].id);
            }
        }
    }, [item, areas]);

    if (!item) return null;

    const handleConfirm = () => {
        if (destinationAreaId && quantity > 0) {
            onConfirm(destinationAreaId, quantity);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Duplicate "{item.name}"</DialogTitle>
                    <DialogDescription>
                        Choose a destination area and quantity to duplicate this item.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination-area">Destination Area</Label>
                        <Select value={destinationAreaId} onValueChange={setDestinationAreaId}>
                            <SelectTrigger id="destination-area">
                                <SelectValue placeholder="Select an area" />
                            </SelectTrigger>
                            <SelectContent>
                                {areas.map(area => (
                                    <SelectItem key={area.id} value={area.id}>
                                        {area.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                            min="1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!destinationAreaId || quantity <= 0}>Duplicate</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const productEditSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  modelNumber: z.string().min(1, 'Model number is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().optional(),
  dealerCost: z.number().min(0, 'Dealer cost must be positive'),
  msrp: z.number().min(0, 'MSRP must be positive'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProductEditFormValues = z.infer<typeof productEditSchema>;

interface EquipmentEditorProps {
  areas: QuoteArea[];
  onAddProductToArea: (product: Product, areaId: string) => void;
  onUpdateItemQuantityInArea: (productId: string, quantity: number, areaId: string) => void;
  onUpdateItemSellPriceInArea: (itemId: string, sellPrice: number | undefined) => void;
  onUpdateItemsOrderInArea: (areaId: string, items: QuoteItem[]) => void;
  onAddArea: () => void;
  onDeleteArea: (areaId: string) => void;
  onUpdateAreaName: (areaId: string, name: string) => void;
  onDuplicateItemToArea: (item: QuoteItem, areaId: string, quantity: number) => void;
  onDeleteItemFromArea: (productId: string, areaId: string) => void;
  isEditable: boolean;
  onApplyAreaMarkup: (areaId: string, markup: number) => void;
}

export function EquipmentEditor({ areas, onAddProductToArea, onUpdateItemQuantityInArea, onUpdateItemSellPriceInArea, onUpdateItemsOrderInArea, onAddArea, onDeleteArea, onUpdateAreaName, onDuplicateItemToArea, onDeleteItemFromArea, isEditable, onApplyAreaMarkup }: EquipmentEditorProps) {
  const { products: allProducts, addProduct, updateProduct } = useProducts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [targetAreaId, setTargetAreaId] = useState<string | undefined>(areas[0]?.id);
  const [itemToDuplicate, setItemToDuplicate] = useState<QuoteItem | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  
  const form = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
  });

  useEffect(() => {
    if (selectedProduct) {
        form.reset({
            name: selectedProduct.name,
            modelNumber: selectedProduct.modelNumber,
            brand: selectedProduct.brand,
            description: selectedProduct.description || '',
            dealerCost: selectedProduct.dealerCost,
            msrp: selectedProduct.msrp,
            imageUrl: selectedProduct.imageUrl || '',
        });
    }
  }, [selectedProduct, form]);

  useEffect(() => {
    if (!targetAreaId && areas.length > 0) {
        setTargetAreaId(areas[0].id);
    }
  }, [areas, targetAreaId]);

  const brands = useMemo(() => ['all', ...Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)))], [allProducts]);
  const categories = useMemo(() => ['all', ...Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean)))], [allProducts]);

  const hasUserSearched = useMemo(() => searchTerm.trim() !== '' || selectedBrand !== 'all' || selectedCategory !== 'all', [searchTerm, selectedBrand, selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!hasUserSearched) {
      return [];
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allProducts
      .filter((product) => selectedBrand === 'all' || product.brand === selectedBrand)
      .filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
      .filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          product.modelNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
          product.brand.toLowerCase().includes(lowerCaseSearchTerm) ||
          (product.description && product.description.toLowerCase().includes(lowerCaseSearchTerm))
      );
    },
    [searchTerm, selectedBrand, selectedCategory, allProducts, hasUserSearched]
  );
  
  const handleSelectProduct = (product: Product) => {
    if (isEditable) {
      setSelectedProduct(product);
    }
  }

  const handleSaveAndAddProduct = async (data: ProductEditFormValues) => {
    if (!selectedProduct || !targetAreaId) return;
    
    try {
        await updateProduct(selectedProduct.id, data);
        const updatedProduct = { ...selectedProduct, ...data };
        onAddProductToArea(updatedProduct, targetAreaId);
        toast({ title: "Product Updated & Added", description: `${data.name} has been saved and added to the quote.` });
        setSelectedProduct(null);
    } catch(e) {
        // Error toast is handled in the context.
    }
  }

  const handleConfirmDuplication = (destinationAreaId: string, quantity: number) => {
    if (itemToDuplicate) {
        onDuplicateItemToArea(itemToDuplicate, destinationAreaId, quantity);
        setItemToDuplicate(null);
    }
  };
  
  const handleSaveNewProduct = async (product: Product) => {
    await addProduct(product);
    if (targetAreaId) {
        onAddProductToArea(product, targetAreaId);
    }
  };


  return (
    <div className="grid gap-4">
      <Card>
          <CardHeader>
              <CardTitle className="font-headline font-light text-2xl">Product Search</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex gap-2">
                  <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search products by name, model, brand, or description..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                          {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category === 'all' ? 'All Categories' : category}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                          {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand === 'all' ? 'All Brands' : brand}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setIsAddProductDialogOpen(true)} disabled={!isEditable}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Product
                  </Button>
              </div>
              <div className="mt-4 max-h-[300px] overflow-auto space-y-1">
                  {hasUserSearched ? (
                      filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-4 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                            onClick={() => handleSelectProduct(product)}
                          >
                            <img alt={product.name} className="aspect-square rounded-md object-contain bg-muted h-10 w-10" src={product.imageUrl} data-ai-hint="product image" />
                            <div className="flex-grow">
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.modelNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatCurrency(product.dealerCost)}</p>
                              <p className="text-xs text-muted-foreground">Cost</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-sm text-muted-foreground">
                            No products found.
                        </div>
                      )
                  ) : (
                    <div className="text-center p-4 text-sm text-muted-foreground h-[300px] flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Info className="h-8 w-8 text-muted-foreground/50" />
                            <p className="font-medium mt-2">Find products to add to your quote</p>
                            <p className="text-xs">Use the search bar or filters above to begin.</p>
                        </div>
                    </div>
                  )}
              </div>
          </CardContent>
      </Card>
      
      <AddProductDialog
        isOpen={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        onSave={handleSaveNewProduct}
        brands={brands.filter(b => b !== 'all')}
      />

      <Dialog open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-3xl">
              {selectedProduct && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveAndAddProduct)}>
                        <DialogHeader>
                            <DialogTitle>Edit and Add Product</DialogTitle>
                            <DialogDescription>Make changes before adding to the quote. Changes will be saved to the library.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex gap-6 items-start">
                                <div className="w-1/4 flex flex-col items-center gap-2">
                                     <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="aspect-square w-full rounded-lg object-contain bg-muted" data-ai-hint="product image" />
                                     <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                            <FormLabel className="sr-only">Image URL</FormLabel>
                                            <FormControl><Input {...field} placeholder="Image URL" className="text-xs h-8" /></FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-3/4 space-y-4">
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                        control={form.control}
                                        name="dealerCost"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Dealer Cost</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
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
                                            <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                </div>
                            </div>
                            
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

                          <div className="space-y-2">
                            <Label>Add to Area</Label>
                            <Select value={targetAreaId} onValueChange={setTargetAreaId}>
                                <SelectTrigger id="target-area">
                                    <SelectValue placeholder="Select an area" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map(area => (
                                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setSelectedProduct(null)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save & Add to Quote
                            </Button>
                        </DialogFooter>
                    </form>
                  </Form>
              )}
          </DialogContent>
      </Dialog>
      
      <DuplicateItemDialog
        isOpen={!!itemToDuplicate}
        onOpenChange={(isOpen) => !isOpen && setItemToDuplicate(null)}
        item={itemToDuplicate}
        areas={areas}
        onConfirm={handleConfirmDuplication}
      />
      
      <div className="space-y-4">
        {areas.map(area => (
            <AreaCard
                key={area.id}
                area={area}
                onUpdateAreaName={(name) => onUpdateAreaName(area.id, name)}
                onDeleteItem={(itemId) => onDeleteItemFromArea(itemId, area.id)}
                onUpdateItemQuantity={(itemId, quantity) => onUpdateItemQuantityInArea(itemId, quantity, area.id)}
                onUpdateItemSellPrice={(itemId, sellPrice) => onUpdateItemSellPriceInArea(itemId, sellPrice)}
                onUpdateItemsOrder={(items) => onUpdateItemsOrderInArea(area.id, items)}
                onDuplicateItem={setItemToDuplicate}
                onDeleteArea={onDeleteArea}
                disabledDelete={areas.length <= 1}
                isEditable={isEditable}
                onApplyAreaMarkup={(markup) => onApplyAreaMarkup(area.id, markup)}
            />
        ))}

        {isEditable && (
          <Button onClick={onAddArea} variant="outline" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Area
          </Button>
        )}
      </div>
    </div>
  );
}
