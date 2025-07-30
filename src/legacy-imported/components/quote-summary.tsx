
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Quote, QuoteOption, PricingModel } from '@/lib/types';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Loader2, RotateCcw } from 'lucide-react';
import { calculateTieredTotals, calculateCustomTotals } from '@/lib/pricing';
import { technicians } from '@/data/resources';


interface QuoteSummaryProps {
  quote: Quote;
  activeOption: QuoteOption;
  onUpdate: (updates: Partial<Quote>) => void;
  onPricingModelChange: (model: PricingModel) => void;
  isEditable: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const InvoiceLineItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value}</span>
    </div>
);

const BreakdownRow = ({ label, value }: { label: React.ReactNode; value: string | React.ReactNode; }) => (
    <div className="flex items-center justify-between py-2 border-b">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-semibold text-sm">{value}</span>
    </div>
);


export function QuoteSummary({ quote, activeOption, onUpdate, onPricingModelChange, isEditable }: QuoteSummaryProps) {
  const [localLaborSellPrice, setLocalLaborSellPrice] = useState('');
  const [localShippingPercentage, setLocalShippingPercentage] = useState('');
  const [localCompanyShippingPercentage, setLocalCompanyShippingPercentage] = useState('');
  const [localTaxRate, setLocalTaxRate] = useState('');
  const [localDiscountValue, setLocalDiscountValue] = useState('');

  const useTieredPricing = quote.pricingModel === 'tiered';

  const allResources = React.useMemo(() => [...technicians, ...(quote.subcontractors || [])], [quote.subcontractors]);

  const customTotals = React.useMemo(() => {
    return calculateCustomTotals(activeOption, quote, allResources);
  }, [activeOption, quote, allResources]);
  
  const tieredPricingBreakdown = React.useMemo(() => {
    const tieredTotals = calculateTieredTotals(activeOption, quote, allResources);
    
    if (tieredTotals.totalCompanyCost <= 0) {
        return { isEmpty: true };
    }

    return {
        ourCost: tieredTotals.totalCompanyCost,
        materialCost: tieredTotals.materialCost,
        laborCost: tieredTotals.laborCost,
        shippingCost: tieredTotals.totalCompanyCost - tieredTotals.materialCost - tieredTotals.laborCost,
        gpm: tieredTotals.marginPercentage,
        sellingPrice: tieredTotals.customerPrice,
        materialPrice: tieredTotals.materialSellPrice,
        laborAmount: tieredTotals.laborSellPrice,
        shippingAmount: tieredTotals.shippingCharge,
        subtotal: tieredTotals.customerPrice,
        tax: tieredTotals.tax,
        grandTotal: tieredTotals.finalPrice,
        isEmpty: false,
    };
  }, [activeOption, quote, allResources]);

  useEffect(() => {
    if (customTotals?.laborSellPrice) {
      setLocalLaborSellPrice(customTotals.laborSellPrice.toFixed(2));
    }
    setLocalShippingPercentage(quote.shippingCustomerPercentage.toString());
    setLocalCompanyShippingPercentage(quote.shippingCompanyPercentage.toString());
    setLocalTaxRate(quote.taxRate.toString());
    setLocalDiscountValue(quote.discountValue.toString());

  }, [customTotals?.laborSellPrice, quote]);

  if (!activeOption || !customTotals) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pricing Summary</CardTitle>
                <CardDescription>A side-by-side comparison of company costs vs. customer pricing for this option.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Loading option summary...</p>
            </CardContent>
        </Card>
    );
  }

  const handleLaborOverride = () => {
    const numericValue = parseFloat(localLaborSellPrice);
    if (!isNaN(numericValue)) {
      const updatedOptions = quote.options.map(opt => 
        opt.id === activeOption.id 
          ? { ...opt, laborSellPriceOverride: numericValue }
          : opt
      );
      onUpdate({ options: updatedOptions });
    }
  };

  const handleResetLaborOverride = () => {
    const updatedOptions = quote.options.map(opt => {
        if (opt.id === activeOption.id) {
            const { laborSellPriceOverride, ...rest } = opt;
            return rest;
        }
        return opt;
    });
    onUpdate({ options: updatedOptions });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
    }
  };
  
  const handleDiscountTypeChange = (value: 'fixed' | 'percentage') => {
    if (value) {
      onUpdate({ discountType: value });
    }
  };
  
  const companyShippingCost = customTotals.totalCompanyCost - customTotals.materialCost - customTotals.laborCost;
  
  const invoiceBreakdown = React.useMemo(() => {
    const activeTotals = useTieredPricing ? calculateTieredTotals(activeOption, quote, allResources) : customTotals;

    const { materialSellPrice, shippingCharge, laborSellPrice, customerPrice, discount, firstInvoice, secondInvoice, finalPrice } = activeTotals;

    const discountRatio1 = customerPrice > 0 ? (materialSellPrice + shippingCharge + (laborSellPrice * 0.25)) / customerPrice : 0;
    
    const invoice1Discount = discount * discountRatio1;
    const invoice2Discount = discount * (1 - discountRatio1);

    const invoice1Subtotal = materialSellPrice + shippingCharge + (laborSellPrice * 0.25);
    const invoice1Taxable = invoice1Subtotal - invoice1Discount;
    const invoice1Tax = invoice1Taxable * (quote.taxRate / 100);

    const invoice2Subtotal = laborSellPrice * 0.75;
    const invoice2Taxable = invoice2Subtotal - invoice2Discount;
    const invoice2Tax = invoice2Taxable * ((quote.taxRate || 0) / 100);

    return {
        firstInvoice: {
            materials: materialSellPrice,
            shipping: shippingCharge,
            labor: laborSellPrice * 0.25,
            discount: invoice1Discount,
            tax: firstInvoice > 0 ? invoice1Tax : 0, 
            total: firstInvoice,
        },
        secondInvoice: {
            labor: laborSellPrice * 0.75,
            discount: invoice2Discount,
            tax: secondInvoice > 0 ? invoice2Tax: 0,
            total: secondInvoice,
        },
        grandTotal: finalPrice,
    };
  }, [useTieredPricing, activeOption, quote, customTotals, allResources]);

  const profitabilityData = React.useMemo(() => {
    if (useTieredPricing && !tieredPricingBreakdown.isEmpty) {
      const profit = tieredPricingBreakdown.sellingPrice - tieredPricingBreakdown.ourCost;
      const markup = tieredPricingBreakdown.ourCost > 0 ? tieredPricingBreakdown.sellingPrice / tieredPricingBreakdown.ourCost : 0;
      return {
        title: "Profitability (Tiered Model)",
        profit: profit,
        grossMargin: tieredPricingBreakdown.gpm,
        markup: markup,
        companyCost: tieredPricingBreakdown.ourCost,
      };
    } else {
      const profit = (customTotals.customerPrice - customTotals.discount) - customTotals.totalCompanyCost;
      const totalMarkup = customTotals.totalCompanyCost > 0 ? (customTotals.customerPrice - customTotals.discount) / customTotals.totalCompanyCost : 0;
      return {
        title: "Profitability (Custom Pricing)",
        profit: profit,
        grossMargin: customTotals.marginPercentage,
        markup: totalMarkup,
        companyCost: customTotals.totalCompanyCost,
      };
    }
  }, [useTieredPricing, tieredPricingBreakdown, customTotals]);

  const gpmColorStyle = React.useMemo(() => {
    const margin = profitabilityData.grossMargin;
    const clampedMargin = Math.max(0, Math.min(margin, 40));
    const hue = (clampedMargin / 40) * 120;
    return { color: `hsl(${hue}, 90%, 45%)` };
  }, [profitabilityData.grossMargin]);


  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-1 flex flex-col gap-4">
            <Card className="flex flex-col flex-grow">
            <CardHeader>
                <CardTitle>Pricing Adjustments</CardTitle>
                <CardDescription>Adjustments apply to this option only.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="space-y-2">
                    <Label>Shipping</Label>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="w-28 space-y-1">
                        <div className="relative">
                            <Input
                                type="text"
                                value={localShippingPercentage}
                                onChange={e => setLocalShippingPercentage(e.target.value)}
                                onBlur={() => onUpdate({ shippingCustomerPercentage: parseFloat(localShippingPercentage) || 0 })}
                                className="pr-6 h-9"
                                disabled={!isEditable}
                            />
                            <span className="absolute inset-y-0 right-2 flex items-center text-muted-foreground text-sm">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Customer</p>
                        </div>
                        <div className="w-28 space-y-1">
                        <div className="relative">
                            <Input
                                type="text"
                                value={localCompanyShippingPercentage}
                                onChange={e => setLocalCompanyShippingPercentage(e.target.value)}
                                onBlur={() => onUpdate({ shippingCompanyPercentage: parseFloat(localCompanyShippingPercentage) || 0 })}
                                className="pr-6 h-9"
                                disabled={!isEditable}
                            />
                            <span className="absolute inset-y-0 right-2 flex items-center text-muted-foreground text-sm">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Company</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Sales Tax</Label>
                    <div className="relative w-28">
                        <Input
                            type="text"
                            value={localTaxRate}
                            onChange={e => setLocalTaxRate(e.target.value)}
                            onBlur={() => onUpdate({ taxRate: parseFloat(localTaxRate) || 0 })}
                            className="pr-6 h-9"
                            disabled={!isEditable}
                        />
                        <span className="absolute inset-y-0 right-2 flex items-center text-muted-foreground text-sm">%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Discount</Label>
                    <div className="flex gap-2 w-full max-w-xs">
                        <div className="relative flex-grow">
                        <Input
                            type="text"
                            value={localDiscountValue}
                            onChange={e => setLocalDiscountValue(e.target.value)}
                            onBlur={() => onUpdate({ discountValue: parseFloat(localDiscountValue) || 0 })}
                            className={cn(quote.discountType === 'percentage' && 'pr-6', 'h-9')}
                            disabled={!isEditable}
                        />
                        {quote.discountType === 'percentage' && <span className="absolute inset-y-0 right-2 flex items-center text-muted-foreground text-sm">%</span>}
                        </div>
                        <ToggleGroup type="single" value={quote.discountType} onValueChange={handleDiscountTypeChange} className="border rounded-md bg-muted/50 p-0.5 h-9" disabled={!isEditable}>
                            <ToggleGroupItem value="fixed" className="h-full px-2 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm rounded-sm">
                                $
                            </ToggleGroupItem>
                            <ToggleGroupItem value="percentage" className="h-full px-2 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm rounded-sm">
                                %
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

            </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Internal Invoice Preview</CardTitle>
                    <CardDescription>Estimated payment schedule.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <p className="font-semibold text-sm">First Invoice (Acceptance)</p>
                        <div className="space-y-1">
                            <InvoiceLineItem label="Materials" value={formatCurrency(invoiceBreakdown.firstInvoice.materials)} />
                            <InvoiceLineItem label="Shipping" value={formatCurrency(invoiceBreakdown.firstInvoice.shipping)} />
                            <InvoiceLineItem label="Labor (25%)" value={formatCurrency(invoiceBreakdown.firstInvoice.labor)} />
                            {invoiceBreakdown.firstInvoice.discount > 0 && <InvoiceLineItem label="Discount" value={`- ${formatCurrency(invoiceBreakdown.firstInvoice.discount)}`} />}
                            <InvoiceLineItem label={`Tax (${quote.taxRate}%)`} value={formatCurrency(invoiceBreakdown.firstInvoice.tax)} />
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatCurrency(invoiceBreakdown.firstInvoice.total)}</span>
                        </div>
                    </div>

                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <p className="font-semibold text-sm">Second Invoice (Completion)</p>
                        <div className="space-y-1">
                            <InvoiceLineItem label="Labor (75%)" value={formatCurrency(invoiceBreakdown.secondInvoice.labor)} />
                            {invoiceBreakdown.secondInvoice.discount > 0 && <InvoiceLineItem label="Discount" value={`- ${formatCurrency(invoiceBreakdown.secondInvoice.discount)}`} />}
                            <InvoiceLineItem label={`Tax (${quote.taxRate}%)`} value={formatCurrency(invoiceBreakdown.secondInvoice.tax)} />
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatCurrency(invoiceBreakdown.secondInvoice.total)}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-4 border-t bg-muted/20">
                    <div className="flex items-baseline justify-between w-full">
                        <span className="font-semibold">Total Amount</span>
                        <span className="font-bold text-lg text-primary">{formatCurrency(invoiceBreakdown.grandTotal)}</span>
                    </div>
                </CardFooter>
            </Card>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
            <Card>
            <CardHeader>
                <CardTitle>Custom Pricing Model</CardTitle>
                <CardDescription>A side-by-side comparison of company costs vs. customer pricing for this option.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                <h4 className="font-semibold mb-3 text-center">Company Cost</h4>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Equipment</span>
                    <span>{formatCurrency(customTotals.materialCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Labor</span>
                    <span>{formatCurrency(customTotals.laborCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(companyShippingCost)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold text-base">
                    <span>Total Company Cost</span>
                    <span>{formatCurrency(customTotals.totalCompanyCost)}</span>
                </div>
                </div>
                
                <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                  <h4 className="font-semibold mb-3 text-center">Customer Price</h4>
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Equipment</span>
                      <span>{formatCurrency(customTotals.materialSellPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Labor</span>
                      <div className="flex items-center gap-1">
                          {activeOption.laborSellPriceOverride !== undefined && isEditable && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleResetLaborOverride}>
                                                <RotateCcw className="h-3 w-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Reset to calculated labor cost</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                          )}
                          <div className="relative w-24">
                            <span className="absolute inset-y-0 left-2 flex items-center text-muted-foreground text-xs">$</span>
                            <Input
                              type="text"
                              value={localLaborSellPrice}
                              onChange={(e) => setLocalLaborSellPrice(e.target.value)}
                              onBlur={handleLaborOverride}
                              onKeyDown={handleKeyDown}
                              className="h-7 text-right pr-2 pl-5"
                              disabled={!isEditable}
                            />
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatCurrency(customTotals.shippingCharge)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(customTotals.customerPrice)}</span>
                  </div>
                  {customTotals.discount > 0 && (
                      <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-destructive">- {formatCurrency(customTotals.discount)}</span>
                      </div>
                  )}
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax ({quote.taxRate}%)</span>
                      <span>{formatCurrency(customTotals.tax)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-semibold text-lg text-primary">
                      <span>Grand Total</span>
                      <span>{formatCurrency(customTotals.finalPrice)}</span>
                  </div>
                </div>
            </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{profitabilityData.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                        <div
                            className={cn(
                            "grid gap-4 text-center",
                            profitabilityData.companyCost > 0 ? "grid-cols-3" : "grid-cols-2"
                            )}
                        >
                            <div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider cursor-help underline decoration-dotted decoration-muted-foreground/50">Total Profit</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Selling Price - Total Company Cost</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <p className="font-bold text-lg">{formatCurrency(profitabilityData.profit)}</p>
                            </div>
                            <div>
                            <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider cursor-help underline decoration-dotted decoration-muted-foreground/50">Gross Margin</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>(Profit / Selling Price) × 100%</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <p className="font-bold text-lg" style={gpmColorStyle}>{profitabilityData.grossMargin.toFixed(2)}%</p>
                            </div>
                            {profitabilityData.companyCost > 0 && (
                            <div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider cursor-help underline decoration-dotted decoration-muted-foreground/50">Markup</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Selling Price / Total Company Cost</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <p className="font-bold text-lg">{`${profitabilityData.markup.toFixed(2)}x`}</p>
                            </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Tiered Pricing Model</CardTitle>
                            <CardDescription>Toggle to see a comparison using the new GPM model.</CardDescription>
                        </div>
                        <Switch
                            id="tiered-pricing-toggle"
                            checked={useTieredPricing}
                            onCheckedChange={(checked) => onPricingModelChange(checked ? 'tiered' : 'custom')}
                            disabled={!isEditable}
                        />
                    </div>
                </CardHeader>
                {useTieredPricing && (
                    <CardContent>
                        {tieredPricingBreakdown?.isEmpty ? (
                            <div className="text-center text-muted-foreground p-8">
                                <p>This model requires company costs to generate a comparison.</p>
                            </div>
                        ) : tieredPricingBreakdown && (
                            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-center mb-2">Company Cost Breakdown</h4>
                                    <BreakdownRow label="Equipment Cost" value={formatCurrency(tieredPricingBreakdown.materialCost)} />
                                    <BreakdownRow label="Labor Cost" value={formatCurrency(tieredPricingBreakdown.laborCost)} />
                                    <BreakdownRow label="Shipping Cost" value={formatCurrency(tieredPricingBreakdown.shippingCost)} />
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t">
                                        <span className="font-semibold">Total Company Cost</span>
                                        <span className="font-semibold">{formatCurrency(tieredPricingBreakdown.ourCost)}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold text-center mb-2">Tiered Price Calculation</h4>
                                    <BreakdownRow label={<>Target GPM <span className="font-normal text-muted-foreground/80">(based on total cost)</span></>} value={`${tieredPricingBreakdown.gpm}%`} />
                                    <BreakdownRow label="Calculated Selling Price" value={formatCurrency(tieredPricingBreakdown.sellingPrice)} />
                                </div>

                                <div>
                                    <h4 className="font-semibold text-center mb-2">Customer Price Allocation</h4>
                                    <BreakdownRow label="1. Materials" value={formatCurrency(tieredPricingBreakdown.materialPrice)} />
                                    <BreakdownRow label="2. Labor" value={formatCurrency(tieredPricingBreakdown.laborAmount)} />
                                    <BreakdownRow label="3. Shipping" value={formatCurrency(tieredPricingBreakdown.shippingAmount)} />
                                    <Separator className="my-2" />
                                    <BreakdownRow label="Subtotal" value={formatCurrency(tieredPricingBreakdown.subtotal)} />
                                    <BreakdownRow label={`Tax (${quote.taxRate}%)`} value={formatCurrency(tieredPricingBreakdown.tax)} />
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t">
                                        <span className="font-semibold text-base text-primary">Grand Total</span>
                                        <span className="font-bold text-lg text-primary">{formatCurrency(tieredPricingBreakdown.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
        </div>
    </div>
  );
}
