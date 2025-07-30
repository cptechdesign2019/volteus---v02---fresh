// src/components/quote-builder-page.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { v4 as uuidv4 } from 'uuid';
import { EquipmentEditor } from './quote-editor';
import { LaborEditor } from './labor-editor';
import { generateScopeOfWorkAction } from '@/app/actions';
import type { Product, LaborCategory, Subcontractor, Quote, QuoteOption, QuoteItem, QuoteArea, CustomerType, QuoteStatus, PricingModel, ChangeLogEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Plus, X, Pencil, Mic, Send, History, Eye } from 'lucide-react';
import { AddOptionDialog } from './add-option-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { TinyMceEditor } from './tinymce-editor';
import { QuoteSummary } from './quote-summary';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SendQuoteDialog } from './send-quote-dialog';
import { Badge } from './ui/badge';
import { ClientOnlyPdfControl } from './client-only-pdf-control';
import { useQuotes } from '@/contexts/quote-context';
import { ChangesRequestedDialog } from '@/components/changes-requested-dialog';
import Link from 'next/link';


const getMarginMultiplier = (projectCost: number, customerType: CustomerType): number => {
  if (customerType === 'School') {
    return 1.333; // 25% margin
  }

  if (projectCost <= 5000) return 1.818; // 45% margin
  if (projectCost <= 15000) return 1.667; // 40% margin
  if (projectCost <= 25000) return 1.538; // 35% margin
  return 1.429; // 30% margin
}


const ScopeOfWorkEditor = ({
  scopeOfWork,
  setScopeOfWork,
  customPrompt,
  setCustomPrompt,
  onGenerateSow,
  isGeneratingSow,
  isListening,
  onToggleListening,
  isEditable,
}: {
  scopeOfWork: string;
  setScopeOfWork: (sow: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onGenerateSow: () => void;
  isGeneratingSow: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  isEditable: boolean;
}) => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>AI Prompt</CardTitle>
        <CardDescription>
          Provide instructions for the AI. It will automatically see the equipment list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="e.g., 'This is a retrofit. The existing speakers and TV should be removed. The client wants to reuse their existing network switch.'"
          className="min-h-[150px]"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          disabled={isListening || !isEditable}
        />
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-2">
        <Button onClick={onGenerateSow} disabled={isGeneratingSow || !isEditable}>
          {isGeneratingSow ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate with AI
        </Button>
         <Button variant="outline" size="icon" onClick={onToggleListening} title={isListening ? 'Stop listening' : 'Start listening'} disabled={!isEditable}>
            <Mic className={cn("h-5 w-5", isListening && "text-destructive animate-pulse")} />
            <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
        </Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Scope of Work</CardTitle>
        <CardDescription>
          This text will be included in the final proposal. Use the AI to generate a starting point, then edit as needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TinyMceEditor
          value={scopeOfWork}
          onEditorChange={(content) => setScopeOfWork(content)}
          disabled={!isEditable}
        />
      </CardContent>
    </Card>
  </div>
);

interface QuoteBuilderPageProps {
  quote: Quote;
  onUpdate: (updatedQuote: Partial<Quote>) => void;
  activeOptionId?: string;
  onActiveOptionIdChange: (id?: string) => void;
}

const statusColors: Record<QuoteStatus, string> = {
  draft: 'bg-gray-500 hover:bg-gray-600',
  sent: 'bg-blue-500 hover:bg-blue-600',
  'pending-changes': 'bg-orange-500 hover:bg-orange-600',
  accepted: 'bg-green-600 hover:bg-green-700',
  expired: 'bg-red-600 hover:bg-red-700',
};

const quoteStatuses: QuoteStatus[] = ['draft', 'sent', 'pending-changes', 'accepted', 'expired'];

export function QuoteBuilderPage({
  quote,
  onUpdate,
  activeOptionId,
  onActiveOptionIdChange,
}: QuoteBuilderPageProps) {
  const { toast } = useToast();
  const { updateQuote } = useQuotes();
  const [activeInnerTab, setActiveInnerTab] = useState('equipment');
  const [isGeneratingSow, setIsGeneratingSow] = useState(false);
  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] = useState(false);
  const [isSendQuoteDialogOpen, setIsSendQuoteDialogOpen] = useState(false);
  const [isChangesDialog, setIsChangesDialog] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [customSowPrompt, setCustomSowPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const isEditable = useMemo(() => quote.status === 'draft' || quote.status === 'pending-changes', [quote.status]);


  useEffect(() => {
    if (typeof window === 'undefined' || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
        let interim_transcript = '';
        let final_transcript_chunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript_chunk += event.results[i][0].transcript + ' ';
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        finalTranscriptRef.current += final_transcript_chunk;
        setCustomSowPrompt(finalTranscriptRef.current + interim_transcript);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
            variant: "destructive",
            title: "Voice Recognition Error",
            description: event.error === 'no-speech' ? 'No speech was detected.' : `An error occurred: ${event.error}`,
        });
        setIsListening(false);
    };
  }, [toast]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
        toast({
            variant: "destructive",
            title: "Unsupported Browser",
            description: "Your browser does not support voice recognition.",
        });
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
    } else {
        finalTranscriptRef.current = customSowPrompt ? customSowPrompt.trim() + ' ' : '';
        setIsListening(true);
        recognitionRef.current.start();
    }
  };


  // Ensure activeOptionId is always valid
  useEffect(() => {
    if (!quote.options.find(opt => opt.id === activeOptionId)) {
        onActiveOptionIdChange(quote.options[0]?.id);
    }
  }, [quote.options, activeOptionId, onActiveOptionIdChange]);

  const activeOption = useMemo(() => 
    quote.options.find(opt => opt.id === activeOptionId),
    [quote.options, activeOptionId]
  );
  
  const updateOption = (optionId: string, optionUpdates: Partial<QuoteOption>) => {
    const newOptions = quote.options.map(opt => 
      opt.id === optionId ? { ...opt, ...optionUpdates } : opt
    );
    onUpdate({ options: newOptions });
  };
  
  const handleAddOption = (sourceOptionId?: string) => {
    let sourceOption: QuoteOption | undefined;
    if (sourceOptionId) {
      sourceOption = quote.options.find(opt => opt.id === sourceOptionId);
    }
    
    const initialLaborCategories: LaborCategory[] = [
      { id: 'design', name: 'System Design & Engineering', clientRate: 150, estimatedTechDays: 0.5, assignedTechnicians: [{ resourceId: 'tech-todd' }], assignedSubcontractors: [] },
      { id: 'programming', name: 'Programming', clientRate: 150, estimatedTechDays: 0, assignedTechnicians: [{ resourceId: 'tech-todd' }], assignedSubcontractors: [] },
      { id: 'prewire', name: 'Pre-wire', clientRate: 100, estimatedTechDays: 0, assignedTechnicians: [], assignedSubcontractors: [] },
      { id: 'install', name: 'Installation', clientRate: 100, estimatedTechDays: 1, assignedTechnicians: [
          { resourceId: 'tech-austin' },
          { resourceId: 'tech-john' },
          { resourceId: 'tech-joe' }
      ], assignedSubcontractors: [] },
    ];

    const newOption: QuoteOption = {
      id: uuidv4(),
      name: `Option ${quote.options.length + 1}`,
      areas: sourceOption ? JSON.parse(JSON.stringify(sourceOption.areas)) : [{ id: uuidv4(), name: 'Area 1', items: [] }],
      laborCategories: sourceOption ? JSON.parse(JSON.stringify(sourceOption.laborCategories)) : initialLaborCategories,
      scopeOfWork: '',
      useSimpleLabor: false,
      simpleLabor: { numDays: 1, rate: 100, assignedTechnicians: [] },
      totals: {
        materialCost: 0,
        laborCost: 0,
        totalCompanyCost: 0,
        customerPrice: 0,
        discount: 0,
        tax: 0,
        finalPrice: 0,
        marginPercentage: 0,
        materialSellPrice: 0,
        laborSellPrice: 0,
        shippingCharge: 0,
        firstInvoice: 0,
        secondInvoice: 0,
      }
    };
    
    const newOptions = [...quote.options, newOption];
    onUpdate({ options: newOptions });
    onActiveOptionIdChange(newOption.id); // Switch to the new option
    setIsAddOptionDialogOpen(false);
  };
  
  const handleDeleteOption = (optionId: string) => {
    if (quote.options.length <= 1) return;

    const newOptions = quote.options.filter(opt => opt.id !== optionId);
        
    onUpdate({ options: newOptions });

    if (activeOptionId === optionId) {
        onActiveOptionIdChange(newOptions[0]?.id);
    }
  };

  const addProductToArea = (product: Product, areaId: string) => {
    if (!activeOption) return;
    const newAreas = activeOption.areas.map(area => {
        if (area.id === areaId) {
            const existingItem = area.items.find(item => item.id === product.id);
            const newItems = existingItem 
              ? area.items.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item)
              : [...area.items, {...product, quantity: 1}];
            return { ...area, items: newItems };
        }
        return area;
    });
    updateOption(activeOption.id, { areas: newAreas });
  };

  const updateItemQuantityInArea = (productId: string, quantity: number, areaId: string) => {
    if (!activeOption) return;
    const newAreas = activeOption.areas.map(area => {
        if (area.id === areaId) {
            const newItems = area.items.map(item => item.id === productId ? {...item, quantity: Math.max(0, quantity)} : item);
            return { ...area, items: newItems };
        }
        return area;
    });
    updateOption(activeOption.id, { areas: newAreas });
  };

   const updateItemSellPriceInArea = (itemId: string, sellPrice: number | undefined) => {
    if (!activeOption) return;

    const newAreas = activeOption.areas.map(area => ({
        ...area,
        items: area.items.map(item => {
            if (item.id === itemId) {
                const { sellPriceOverride, ...rest } = item as any;
                if (sellPrice !== undefined) {
                    return { ...rest, sellPriceOverride: sellPrice };
                }
                return rest; // Reset to default by removing override
            }
            return item;
        })
    }));
    updateOption(activeOption.id, { areas: newAreas });
  };
  
  const handleUpdateItemsOrderInArea = (areaId: string, items: QuoteItem[]) => {
    if (!activeOption) return;
    const newAreas = activeOption.areas.map(area =>
        area.id === areaId ? { ...area, items } : area
    );
    updateOption(activeOption.id, { areas: newAreas });
  };

  const handleDeleteItemFromArea = (itemId: string, areaId: string) => {
    if (!activeOption) return;
    const newAreas = activeOption.areas.map(area => {
        if (area.id === areaId) {
            const newItems = area.items.filter(item => item.id !== itemId);
            return { ...area, items: newItems };
        }
        return area;
    });
    updateOption(activeOption.id, { areas: newAreas });
  };
  
  const updateOptionData = (updates: Partial<QuoteOption>) => {
    if (!activeOption) return;
    updateOption(activeOption.id, updates);
  };

  const updateSubcontractors = (subcontractors: Subcontractor[]) => {
    onUpdate({ subcontractors });
  };

  const setScopeOfWork = (sow: string) => {
    if (!activeOption) return;
    updateOption(activeOption.id, { scopeOfWork: sow });
  };
  
  const handleGenerateSow = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
    }
    if (!activeOption) return;
    setIsGeneratingSow(true);
    const equipmentList = activeOption.areas.map(area => 
      `## ${area.name}\n` + 
      area.items.map(item => `${item.quantity}x ${item.name} (${item.modelNumber})`).join('\n')
    ).join('\n\n');
    const result = await generateScopeOfWorkAction(equipmentList, customSowPrompt);
    if(result.scopeOfWork) {
        setScopeOfWork(result.scopeOfWork);
        toast({ title: "Success", description: "Scope of Work generated." });
    } else if (result.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsGeneratingSow(false);
  };
  
  const handleAddArea = () => {
    if (!activeOption) return;
    const newArea: QuoteArea = {
      id: uuidv4(),
      name: `Area ${activeOption.areas.length + 1}`,
      items: [],
    };
    updateOption(activeOption.id, { areas: [...activeOption.areas, newArea] });
  };
  
  const handleDeleteArea = (areaId: string) => {
    if (!activeOption || activeOption.areas.length <= 1) {
      toast({ variant: 'destructive', title: 'Cannot delete the last area.' });
      return;
    }
    const newAreas = activeOption.areas.filter(area => area.id !== areaId);
    updateOption(activeOption.id, { areas: newAreas });
  };

  const handleUpdateAreaName = (areaId: string, name: string) => {
    if (!activeOption) return;
    const newAreas = activeOption.areas.map(area =>
        area.id === areaId ? { ...area, name } : area
    );
    updateOption(activeOption.id, { areas: newAreas });
  };

  const handleDuplicateItemToArea = (itemToDuplicate: QuoteItem, destinationAreaId: string, quantity: number) => {
    if (!activeOption) return;

    const destinationAreaName = activeOption.areas.find(a => a.id === destinationAreaId)?.name || 'the destination area';

    const newAreas = activeOption.areas.map(area => {
      if (area.id === destinationAreaId) {
        const existingItem = area.items.find(item => item.id === itemToDuplicate.id);
        let newItems: QuoteItem[];

        if (existingItem) {
          // Item exists, update quantity
          newItems = area.items.map(item =>
            item.id === itemToDuplicate.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Item doesn't exist, add it
          newItems = [...area.items, { ...itemToDuplicate, quantity }];
        }
        return { ...area, items: newItems };
      }
      return area;
    });

    updateOption(activeOption.id, { areas: newAreas });
    toast({
        title: "Item Duplicated",
        description: `${quantity}x ${itemToDuplicate.name} added to ${destinationAreaName}.`
    })
  };

  const handleApplyAreaMarkup = (areaId: string, markup: number) => {
    if (!activeOption) return;

    const newAreas = activeOption.areas.map(area => {
        if (area.id === areaId) {
            const newItems = area.items.map(item => {
                if (item.dealerCost > 0) {
                    const newSellPrice = item.dealerCost * (1 + markup / 100);
                    return { ...item, sellPriceOverride: newSellPrice };
                }
                return item;
            });
            return { ...area, items: newItems };
        }
        return area;
    });

    updateOption(activeOption.id, { areas: newAreas });
};

  const handlePricingModelChange = (model: PricingModel) => {
    onUpdate({ pricingModel: model });
  };

  const tabTriggerClasses = "h-12 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:text-card-foreground data-[state=inactive]:border";

  return (
      <main className="flex-1 p-4 overflow-auto">
         <Tabs value={activeOptionId} onValueChange={onActiveOptionIdChange} className="w-full">
            {activeInnerTab !== 'review' && (
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <TabsList>
                    {quote.options.map(option => (
                        <div key={option.id} className="relative group/tab-item">
                            <TabsTrigger 
                                value={option.id}
                                className="pr-14"
                            >
                                {editingOptionId === option.id ? (
                                    <Input
                                        value={option.name}
                                        onChange={(e) => updateOption(option.id, { name: e.target.value })}
                                        onBlur={() => setEditingOptionId(null)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Escape') {
                                                e.preventDefault();
                                                setEditingOptionId(null);
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                        className="w-auto max-w-[200px] text-center bg-background border border-primary h-full px-2 py-1 z-10 relative"
                                        disabled={!isEditable}
                                    />
                                ) : (
                                    <span className="truncate max-w-[180px]">{option.name}</span>
                                )}
                            </TabsTrigger>
                            <div className="absolute top-1/2 right-1 -translate-y-1/2 flex items-center opacity-0 group-hover/tab-item:opacity-100 focus-within:opacity-100 transition-opacity">
                                {isEditable && (
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 hover:bg-transparent"
                                      onClick={(e) => {
                                          e.preventDefault();
                                          setEditingOptionId(option.id);
                                      }}
                                      aria-label={`Edit name for ${option.name}`}
                                  >
                                      <Pencil className="h-4 w-4" />
                                  </Button>
                                )}

                                {quote.options.length > 1 && isEditable && (
                                    <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            aria-label={`Delete ${option.name}`}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete "{option.name}" and all of
                                            its contents. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteOption(option.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    ))}
                  </TabsList>
                  {isEditable && (
                    <Button onClick={() => setIsAddOptionDialogOpen(true)} size="sm" variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label>Status:</Label>
                  <Select
                      value={quote.status}
                      onValueChange={(value: QuoteStatus) => onUpdate({ status: value })}
                      disabled={!isEditable}
                  >
                      <SelectTrigger
                          className={cn(
                              'w-[180px] border-0 text-white font-bold capitalize',
                              statusColors[quote.status]
                          )}
                      >
                          <SelectValue placeholder="Set Status" />
                      </SelectTrigger>
                      <SelectContent>
                          {quoteStatuses.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize" disabled={!isEditable && status !== quote.status}>
                                  <Badge
                                      className={cn('w-full justify-center capitalize text-white', statusColors[status])}
                                  >
                                      {status.replace('-', ' ')}
                                  </Badge>
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <AddOptionDialog 
                isOpen={isAddOptionDialogOpen}
                onOpenChange={setIsAddOptionDialogOpen}
                options={quote.options}
                onAdd={handleAddOption}
            />
             <SendQuoteDialog
                isOpen={isSendQuoteDialogOpen}
                onOpenChange={setIsSendQuoteDialogOpen}
                quote={quote}
            />


            {quote.options.map(option => (
                <TabsContent key={option.id} value={option.id} className="m-0 pt-0">
                    {activeOptionId === option.id && activeOption && (
                        <div className="space-y-4">
                            <Tabs value={activeInnerTab} onValueChange={setActiveInnerTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent p-0 mb-4">
                                    <TabsTrigger value="equipment" className={tabTriggerClasses}>1. Equipment</TabsTrigger>
                                    <TabsTrigger value="labor" className={tabTriggerClasses}>2. Labor</TabsTrigger>
                                    <TabsTrigger value="sow" className={tabTriggerClasses}>3. Scope of Work</TabsTrigger>
                                    <TabsTrigger value="review" className={tabTriggerClasses}>4. Review &amp; Send</TabsTrigger>
                                </TabsList>
                                <TabsContent value="equipment" className="mt-4">
                                    <EquipmentEditor
                                        areas={activeOption.areas}
                                        onAddProductToArea={addProductToArea}
                                        onUpdateItemQuantityInArea={updateItemQuantityInArea}
                                        onUpdateItemsOrderInArea={handleUpdateItemsOrderInArea}
                                        onUpdateItemSellPriceInArea={updateItemSellPriceInArea}
                                        onAddArea={handleAddArea}
                                        onDeleteArea={handleDeleteArea}
                                        onUpdateAreaName={handleUpdateAreaName}
                                        onDuplicateItemToArea={handleDuplicateItemToArea}
                                        onDeleteItemFromArea={handleDeleteItemFromArea}
                                        isEditable={isEditable}
                                        onApplyAreaMarkup={handleApplyAreaMarkup}
                                    />
                                </TabsContent>
                                <TabsContent value="labor" className="mt-4">
                                    <LaborEditor
                                        option={activeOption}
                                        subcontractors={quote.subcontractors}
                                        onUpdateOption={updateOptionData}
                                        onUpdateSubcontractors={updateSubcontractors}
                                        isEditable={isEditable}
                                    />
                                </TabsContent>
                                <TabsContent value="sow" className="mt-4">
                                    <ScopeOfWorkEditor
                                        scopeOfWork={activeOption.scopeOfWork}
                                        setScopeOfWork={setScopeOfWork}
                                        customPrompt={customSowPrompt}
                                        setCustomPrompt={setCustomSowPrompt}
                                        onGenerateSow={handleGenerateSow}
                                        isGeneratingSow={isGeneratingSow}
                                        isListening={isListening}
                                        onToggleListening={handleToggleListening}
                                        isEditable={isEditable}
                                    />
                                </TabsContent>
                                <TabsContent value="review" className="mt-4">
                                    <div className="space-y-8">
                                        <div className="space-y-4 text-center">
                                            <h2 className="text-3xl font-bold font-headline tracking-tight">Review &amp; Send</h2>
                                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                                {quote.options.length > 1 
                                                    ? "Select an option to see its financial summary and make final adjustments."
                                                    : "Here is the financial summary for your quote option."}
                                            </p>
                                        </div>

                                        {quote.options.length > 1 && (
                                            <div className="flex items-center justify-center">
                                                <div className="w-full max-w-xs">
                                                    <Label htmlFor="review-option-select" className="sr-only">Select Option to Review</Label>
                                                    <Select value={activeOptionId} onValueChange={onActiveOptionIdChange}>
                                                        <SelectTrigger id="review-option-select" className="text-lg py-6 text-center bg-card shadow-sm border">
                                                            <SelectValue placeholder="Select an option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                        {quote.options.map(opt => (
                                                            <SelectItem key={opt.id} value={opt.id}>
                                                                {opt.name}
                                                            </SelectItem>
                                                        ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <QuoteSummary
                                            quote={quote}
                                            activeOption={activeOption}
                                            onUpdate={onUpdate}
                                            onPricingModelChange={handlePricingModelChange}
                                            isEditable={isEditable}
                                        />

                                        <div className="flex justify-center pt-4 gap-2">
                                            <Button asChild size="lg" style={{ backgroundColor: '#ffa62b', color: 'white' }}>
                                                <Link href={`/quote/${quote.id}`} target="_blank">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Preview Quote
                                                </Link>
                                            </Button>
                                            <Button size="lg" onClick={() => setIsSendQuoteDialogOpen(true)} disabled={quote.status === 'accepted'}>
                                                <Send className="mr-2 h-4 w-4" />
                                                {quote.status === 'pending-changes' ? 'Send Back to Customer' : 'Send to Customer'}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </TabsContent>
            ))}
        </Tabs>
      </main>
  );
}
