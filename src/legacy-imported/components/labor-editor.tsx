
// src/components/labor-editor.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { X, PlusCircle, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import type { LaborCategory, Subcontractor, LaborResource, AssignedResource, AssignedSubcontractor, QuoteOption } from '@/lib/types';
import { technicians } from '@/data/resources';
import { calculateLaborCategoryTotals, calculateSimpleLaborTotals } from '@/lib/pricing';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const WORK_DAY_HOURS = 8;
const DEFAULT_SIMPLE_LABOR_RATE = 100;

interface LaborEditorProps {
  option: QuoteOption;
  subcontractors: Subcontractor[];
  onUpdateOption: (updates: Partial<QuoteOption>) => void;
  onUpdateSubcontractors: (subcontractors: Subcontractor[]) => void;
  isEditable: boolean;
}

export function LaborEditor({ option, subcontractors, onUpdateOption, onUpdateSubcontractors, isEditable }: LaborEditorProps) {
  const allResources: LaborResource[] = useMemo(() => [...technicians, ...subcontractors], [subcontractors]);
  const [isAddSubDialogOpen, setIsAddSubDialogOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', costRate: '' });
  
  const [localSimpleDays, setLocalSimpleDays] = useState('');
  const [localSimpleRate, setLocalSimpleRate] = useState('');
  
  useEffect(() => {
    setLocalSimpleDays(option.simpleLabor?.numDays.toString() || '1');
    setLocalSimpleRate(option.simpleLabor?.rate.toString() || DEFAULT_SIMPLE_LABOR_RATE.toString());
  }, [option.simpleLabor]);


  const laborCategories = option.laborCategories;
  
  const handleCategoryUpdate = (categoryId: LaborCategory['id'], updates: Partial<LaborCategory>) => {
    const newCategories = laborCategories.map(c => c.id === categoryId ? { ...c, ...updates } : c);
    onUpdateOption({ laborCategories: newCategories });
  };
  
  const handleAddTechnician = (categoryId: LaborCategory['id'], resourceId: string) => {
    if (!resourceId) return;
    const category = laborCategories.find(c => c.id === categoryId);
    if (!category || category.assignedTechnicians.some(r => r.resourceId === resourceId)) return;
    const newAssigned: AssignedResource[] = [...category.assignedTechnicians, { resourceId }];
    handleCategoryUpdate(categoryId, { assignedTechnicians: newAssigned });
  };
  
  const handleRemoveTechnician = (categoryId: LaborCategory['id'], resourceId: string) => {
    const category = laborCategories.find(c => c.id === categoryId);
    if (!category) return;
    const newAssigned = category.assignedTechnicians.filter(r => r.resourceId !== resourceId);
    handleCategoryUpdate(categoryId, { assignedTechnicians: newAssigned });
  };
  
  const handleAddSubcontractorAssignment = (categoryId: LaborCategory['id'], resourceId: string) => {
    if (!resourceId) return;
    const category = laborCategories.find(c => c.id === categoryId);
    const sub = subcontractors.find(s => s.id === resourceId);
    if (!category || !sub || category.assignedSubcontractors.some(r => r.resourceId === resourceId)) return;
    
    const newAssignment: AssignedSubcontractor = {
      resourceId,
      estimatedDays: 1,
      clientDailyRate: Math.ceil(sub.costRate / (1 - 0.25)) // Default 25% margin
    };
    const newAssigned: AssignedSubcontractor[] = [...category.assignedSubcontractors, newAssignment];
    handleCategoryUpdate(categoryId, { assignedSubcontractors: newAssigned });
  };

  const handleUpdateSubcontractor = (categoryId: string, subResourceId: string, updates: Partial<AssignedSubcontractor>) => {
    const category = laborCategories.find(c => c.id === categoryId);
    if (!category) return;
    const newAssigned = category.assignedSubcontractors.map(sub => 
      sub.resourceId === subResourceId ? { ...sub, ...updates } : sub
    );
    handleCategoryUpdate(categoryId, { assignedSubcontractors: newAssigned });
  };

  const handleRemoveSubcontractor = (categoryId: string, subResourceId: string) => {
    const category = laborCategories.find(c => c.id === categoryId);
    if (!category) return;
    const newAssigned = category.assignedSubcontractors.filter(sub => sub.resourceId !== subResourceId);
    handleCategoryUpdate(categoryId, { assignedSubcontractors: newAssigned });
  };


  const handleAddNewSubcontractor = () => {
    if (!newSub.name || !newSub.costRate) return;
    const newSubcontractor: Subcontractor = {
      id: `sub-${uuidv4()}`,
      name: newSub.name,
      costRate: parseFloat(newSub.costRate),
      type: 'subcontractor',
    };
    onUpdateSubcontractors([...subcontractors, newSubcontractor]);
    setNewSub({ name: '', costRate: '' });
    setIsAddSubDialogOpen(false);
  };
  
  const grandTotals = useMemo(() => {
    const totals = {
      customerCost: 0,
      companyCost: 0,
      profit: 0,
      manDays: 0,
      manHours: 0,
      gpm: 0,
    };

    laborCategories.forEach(category => {
      const categoryTotals = calculateLaborCategoryTotals(category, allResources);
      totals.customerCost += categoryTotals.customerCost;
      totals.companyCost += categoryTotals.companyCost;

      const techManDays = category.estimatedTechDays * category.assignedTechnicians.length;
      const subManDays = category.assignedSubcontractors.reduce((acc, sub) => acc + sub.estimatedDays, 0);
      
      totals.manDays += techManDays + subManDays;
    });
    
    totals.manHours = totals.manDays * WORK_DAY_HOURS;
    totals.profit = totals.customerCost - totals.companyCost;
    totals.gpm = totals.customerCost > 0 ? (totals.profit / totals.customerCost) * 100 : 0;

    return totals;
  }, [laborCategories, allResources]);

  const grandGpmColorStyle = {
    color: `hsl(${Math.max(0, Math.min(grandTotals.gpm, 40)) / 40 * 120}, 90%, 45%)`
  };

  const handleSimpleLaborToggle = (checked: boolean) => {
    onUpdateOption({
      useSimpleLabor: checked,
      simpleLabor: option.simpleLabor || {
        numDays: 1,
        rate: DEFAULT_SIMPLE_LABOR_RATE,
        assignedTechnicians: [],
      },
    });
  };

  const handleSimpleLaborChange = (field: 'numDays' | 'rate', value: string) => {
    const numericValue = parseFloat(value);
    onUpdateOption({
      simpleLabor: {
        ...(option.simpleLabor!),
        assignedTechnicians: option.simpleLabor?.assignedTechnicians || [],
        [field]: isNaN(numericValue) ? (field === 'numDays' ? 1 : DEFAULT_SIMPLE_LABOR_RATE) : numericValue,
      },
    });
  };
  
  const handleSimpleLaborAssignment = (resourceId: string) => {
    if (!resourceId || !option.simpleLabor) return;
    const simpleLabor = option.simpleLabor;
    const currentAssigned = simpleLabor.assignedTechnicians || [];
    if (currentAssigned.some(r => r.resourceId === resourceId)) return;
    const newAssigned: AssignedResource[] = [...currentAssigned, { resourceId }];
    onUpdateOption({ simpleLabor: { ...simpleLabor, assignedTechnicians: newAssigned } });
  };

  const handleSimpleLaborUnassignment = (resourceId: string) => {
    if (!option.simpleLabor) return;
    const simpleLabor = option.simpleLabor;
    const currentAssigned = simpleLabor.assignedTechnicians || [];
    const newAssigned = currentAssigned.filter(r => r.resourceId !== resourceId);
    onUpdateOption({ simpleLabor: { ...simpleLabor, assignedTechnicians: newAssigned } });
  };
  
  const simpleLaborTotals = useMemo(() => {
    if (!option.useSimpleLabor || !option.simpleLabor) return null;
    return calculateSimpleLaborTotals(option, allResources);
  }, [option, allResources]);

  const simpleGpmColorStyle = {
    color: `hsl(${Math.max(0, Math.min(simpleLaborTotals?.gpm ?? 0, 40)) / 40 * 120}, 90%, 45%)`
  };
  
  const simpleAssignedTechnicians = option.simpleLabor?.assignedTechnicians || [];


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Labor Calculator Mode</CardTitle>
              <CardDescription>Choose between a detailed phase-by-phase breakdown or a simple overall estimate.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="labor-mode-toggle" className={cn(!option.useSimpleLabor && "text-primary")}>Detailed</Label>
              <Switch id="labor-mode-toggle" checked={option.useSimpleLabor} onCheckedChange={handleSimpleLaborToggle} disabled={!isEditable} />
              <Label htmlFor="labor-mode-toggle" className={cn(option.useSimpleLabor && "text-primary")}>Simple</Label>
            </div>
          </div>
        </CardHeader>
        {option.useSimpleLabor && option.simpleLabor && (
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted/50 max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-center mb-4">Simple Labor Estimate</h3>
                <div className="flex items-end justify-center gap-4">
                   <div className="space-y-2">
                    <Label htmlFor="simple-days">Estimated Days</Label>
                    <Input
                      id="simple-days"
                      type="text"
                      value={localSimpleDays}
                      onChange={(e) => setLocalSimpleDays(e.target.value)}
                      onBlur={() => handleSimpleLaborChange('numDays', localSimpleDays)}
                      className="w-32 text-center"
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="text-2xl font-light text-muted-foreground pb-2">&times;</div>
                   <div className="space-y-2">
                    <Label htmlFor="simple-rate">Client Rate (/hr)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
                      <Input
                        id="simple-rate"
                        type="text"
                        value={localSimpleRate}
                        onChange={(e) => setLocalSimpleRate(e.target.value)}
                        onBlur={() => handleSimpleLaborChange('rate', localSimpleRate)}
                        className="w-32 text-center"
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h5 className="font-medium text-sm">Assigned Technicians ({simpleAssignedTechnicians.length})</h5>
                  <div className="w-full max-w-sm mx-auto">
                    {simpleAssignedTechnicians.length > 0 && (
                      <div className="space-y-2 pt-2">
                          {simpleAssignedTechnicians.map(assigned => {
                            const resource = allResources.find(r => r.id === assigned.resourceId);
                            if (!resource || resource.type !== 'technician') return null;
                            return (
                              <div key={resource.id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                                <div>
                                  <p className="font-medium text-sm">{resource.name}</p>
                                  <p className="text-xs text-muted-foreground">{resource.role}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleSimpleLaborUnassignment(resource.id)} disabled={!isEditable}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    <Select onValueChange={(val) => handleSimpleLaborAssignment(val)} value="" disabled={!isEditable}>
                      <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Assign a technician..." />
                      </SelectTrigger>
                      <SelectContent>
                          {technicians.filter(t => !simpleAssignedTechnicians.some(at => at.resourceId === t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.role})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {simpleLaborTotals && (
                <div className="space-y-2 text-sm p-4 rounded-lg bg-background/50">
                  <h4 className="font-semibold text-base mb-4">Financial Summary</h4>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Customer Cost</span>
                        <span className="font-semibold text-base">{formatCurrency(simpleLaborTotals.customerCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Company Cost</span>
                        <span>{formatCurrency(simpleLaborTotals.companyCost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Profit</span>
                        <span className="font-semibold">{formatCurrency(simpleLaborTotals.profit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">GP Margin %</span>
                        <span className="font-semibold" style={simpleGpmColorStyle}>
                            {simpleLaborTotals.gpm.toFixed(2)}%
                        </span>
                    </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
      
      {!option.useSimpleLabor && (
        <>
          <Accordion type="multiple" className="w-full space-y-4 mt-4">
            {laborCategories.map(category => {
              const categoryTotals = calculateLaborCategoryTotals(category, allResources);
              
              const assignedTechIds = category.assignedTechnicians.map(ar => ar.resourceId);
              const availableTechs = technicians.filter(t => !assignedTechIds.includes(t.id));

              const assignedSubIds = category.assignedSubcontractors.map(as => as.resourceId);
              const availableSubs = subcontractors.filter(s => !assignedSubIds.includes(s.id));

              const gpmColorStyle = {
                color: `hsl(${Math.max(0, Math.min(categoryTotals.gpm, 40)) / 40 * 120}, 90%, 45%)`
              };
              
              const isUsed = category.estimatedTechDays > 0 || category.assignedSubcontractors.some(s => s.estimatedDays > 0);
              
              const techCount = category.assignedTechnicians.length;
              const subCount = category.assignedSubcontractors.length;
              const totalResources = techCount + subCount;

              const subManDays = category.assignedSubcontractors.reduce((acc, sub) => acc + sub.estimatedDays, 0);
              const techManDays = techCount > 0 ? category.estimatedTechDays * techCount : 0;
              const totalManDays = techManDays + subManDays;
              const totalManHours = totalManDays * WORK_DAY_HOURS;
              
              const canHaveSubs = true;


              return (
                <AccordionItem key={category.id} value={category.id} className="border-none">
                  <Card>
                    <AccordionTrigger className="p-4 hover:no-underline">
                      <div className="flex flex-1 items-center gap-3">
                          <span className="flex h-2.5 w-2.5">
                              {isUsed && <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>}
                          </span>
                          <CardHeader className="p-0 text-left">
                              <CardTitle className="font-headline font-light text-2xl">{category.name}</CardTitle>
                              <CardDescription>Assign resources and estimate time for this labor phase.</CardDescription>
                          </CardHeader>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex flex-col items-center justify-center w-20">
                              <span className="font-bold text-lg text-foreground">{totalResources}</span>
                              <span className="text-xs uppercase tracking-wider">{totalResources === 1 ? 'Technician' : 'Technicians'}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center w-20">
                              <span className="font-bold text-lg text-foreground">{totalManDays.toFixed(1)}</span>
                              <span className="text-xs uppercase tracking-wider">Days</span>
                          </div>
                          <div className="flex flex-col items-center justify-center w-20">
                              <span className="font-bold text-lg text-foreground">{totalManHours.toFixed(1)}</span>
                              <span className="text-xs uppercase tracking-wider">Man-Hours</span>
                          </div>
                          <div className="flex flex-col items-center justify-center w-24">
                              <span className="font-bold text-lg text-foreground">{formatCurrency(categoryTotals.customerCost)}</span>
                              <span className="text-xs uppercase tracking-wider">Customer Cost</span>
                          </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <CardContent className="p-0 grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          
                          {/* Technician Settings */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">Technician Settings</h4>
                            <div className="flex items-end gap-4">
                              <div className="space-y-2">
                                <Label>Estimated Days</Label>
                                <Input
                                  type="number"
                                  value={category.estimatedTechDays}
                                  onChange={(e) => handleCategoryUpdate(category.id, { estimatedTechDays: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  min="0"
                                  step="0.5"
                                  className="w-28 text-center"
                                  disabled={!isEditable}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Client Rate (/hr)</Label>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    value={category.clientRate}
                                    onChange={(e) => handleCategoryUpdate(category.id, { clientRate: parseFloat(e.target.value) || 0 })}
                                    disabled={category.id === 'design' || category.id === 'programming' || !isEditable}
                                    min="0"
                                    className="w-28 text-center"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Assigned Technicians</h5>
                              <div className="w-full max-w-sm">
                                {category.assignedTechnicians.length > 0 && (
                                  <div className="space-y-2 pt-2">
                                      {category.assignedTechnicians.map(assigned => {
                                        const resource = allResources.find(r => r.id === assigned.resourceId);
                                        if (!resource || resource.type !== 'technician') return null;
                                        return (
                                          <div key={resource.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                            <div>
                                              <p className="font-medium text-sm">{resource.name}</p>
                                              <p className="text-xs text-muted-foreground">{resource.role}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveTechnician(category.id, resource.id)} disabled={!isEditable}>
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                                {category.assignedTechnicians.length === 0 && (
                                  <p className="text-sm text-muted-foreground pt-2">No technicians assigned yet.</p>
                                )}
                                <Select onValueChange={(val) => handleAddTechnician(category.id, val)} value="" disabled={!isEditable}>
                                  <SelectTrigger className="mt-2">
                                      <SelectValue placeholder="Assign a technician..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {availableTechs.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.role})</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {canHaveSubs && <Separator />}

                          {/* Subcontractor Settings */}
                          {canHaveSubs && (
                            <div className="space-y-4">
                              <h4 className="font-semibold">Subcontractor Settings</h4>
                              {category.assignedSubcontractors.length === 0 ? (
                                <p className="text-sm text-muted-foreground pt-2">No subcontractors assigned yet.</p>
                              ) : (
                                <div className="space-y-2 pt-2">
                                    {category.assignedSubcontractors.map(assigned => {
                                      const resource = allResources.find(r => r.id === assigned.resourceId);
                                      if (!resource || resource.type !== 'subcontractor') return null;
                                      
                                      const currentMargin = (resource.costRate > 0 && assigned.clientDailyRate > resource.costRate)
                                        ? (1 - (resource.costRate / assigned.clientDailyRate)) * 100
                                        : 0;

                                      return (
                                        <div key={resource.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 relative">
                                            <div className="flex-1 space-y-3">
                                                <p className="font-medium text-sm">{resource.name}</p>
                                                <div className="flex items-end gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Est. Days</Label>
                                                        <Input
                                                          type="number"
                                                          value={assigned.estimatedDays}
                                                          onChange={(e) => handleUpdateSubcontractor(category.id, resource.id, { estimatedDays: parseFloat(e.target.value) || 0 })}
                                                          min="0"
                                                          className="h-8 w-24 text-center"
                                                          step="0.5"
                                                          disabled={!isEditable}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Margin %</Label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                value={currentMargin.toFixed(0)}
                                                                onChange={(e) => {
                                                                    const newMargin = parseFloat(e.target.value) || 0;
                                                                    if (newMargin < 100 && newMargin >= 0) {
                                                                        const newClientDailyRate = resource.costRate > 0 ? Math.ceil(resource.costRate / (1 - (newMargin / 100))) : 0;
                                                                        handleUpdateSubcontractor(category.id, resource.id, { clientDailyRate: newClientDailyRate });
                                                                    }
                                                                }}
                                                                min="0"
                                                                max="99"
                                                                className="h-8 w-24 text-center pr-6"
                                                                disabled={!isEditable}
                                                            />
                                                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-xs">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground pt-2 space-y-1">
                                                    <p>Client Rate: <span className="font-medium text-foreground">{formatCurrency(assigned.clientDailyRate)}/day</span></p>
                                                    <p>Company Cost: {formatCurrency(resource.costRate)}/day</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive absolute top-1 right-1" onClick={() => handleRemoveSubcontractor(category.id, resource.id)} disabled={!isEditable}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                              <div className="flex gap-2 w-full max-w-sm">
                                <div className="flex-grow">
                                    <Select onValueChange={(val) => handleAddSubcontractorAssignment(category.id, val)} value="" disabled={!isEditable}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assign a subcontractor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="icon" onClick={() => setIsAddSubDialogOpen(true)} disabled={!isEditable}>
                                  <PlusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col justify-between">
                            <div></div>
                            <div className="space-y-2 text-sm p-4 rounded-lg bg-muted/30">
                              <h4 className="font-semibold text-base mb-4">Financial Summary</h4>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Customer Cost</span>
                                    <span className="font-semibold text-base">{formatCurrency(categoryTotals.customerCost)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Company Cost</span>
                                    <span>{formatCurrency(categoryTotals.companyCost)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Profit</span>
                                    <span className="font-semibold">{formatCurrency(categoryTotals.profit)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">GP Margin %</span>
                                    <span className="font-semibold" style={gpmColorStyle}>
                                        {categoryTotals.gpm.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
          
          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Labor Grand Totals</CardTitle>
                <CardDescription>A summary of all labor categories combined.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-2 text-sm p-4 rounded-lg bg-muted/30">
                    <h4 className="font-semibold text-base mb-4">Time Summary</h4>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Man-Days</span>
                        <span className="font-semibold text-base">{grandTotals.manDays.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Man-Hours</span>
                        <span className="font-semibold text-base">{(grandTotals.manHours).toFixed(2)}</span>
                    </div>
                </div>
                <div className="space-y-2 text-sm p-4 rounded-lg bg-muted/30">
                    <h4 className="font-semibold text-base mb-4">Financial Summary</h4>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Customer Cost</span>
                        <span className="font-semibold text-base">{formatCurrency(grandTotals.customerCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Company Cost</span>
                        <span>{formatCurrency(grandTotals.companyCost)}</span>
                    </div>
                    <Separator className="my-2"/>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Profit</span>
                        <span className="font-semibold">{formatCurrency(grandTotals.profit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Overall GP Margin %</span>
                        <span className="font-semibold" style={grandGpmColorStyle}>
                            {grandTotals.gpm.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
        </>
      )}


      <Dialog open={isAddSubDialogOpen} onOpenChange={setIsAddSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcontractor</DialogTitle>
            <DialogDescription>Add a new subcontractor to this quote. This will not add them to the default list for future quotes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sub-name" className="text-right">Name</Label>
              <Input id="sub-name" value={newSub.name} onChange={e => setNewSub(s => ({...s, name: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sub-rate" className="text-right">Daily Rate ($)</Label>
              <Input id="sub-rate" type="number" value={newSub.costRate} onChange={e => setNewSub(s => ({...s, costRate: e.target.value}))} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewSubcontractor}>Add Subcontractor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
