// src/lib/pricing.ts

import type { Quote, QuoteItem, CustomerType, QuoteTotals, LaborCategory, LaborResource, LaborCategoryTotals, AssignedSubcontractor, QuoteOption, PricingModel } from './types';
import { technicians } from '@/data/resources';

const WORK_DAY_HOURS = 8;
const AVG_TECH_HOURLY_COST = 46.41;
const DEFAULT_SIMPLE_LABOR_RATE = 100;

export function getMarginMultiplier(projectCost: number, customerType: CustomerType): number {
  if (customerType === 'School') {
    return 1.333; // 25% margin
  }

  if (projectCost <= 5000) return 1.818; // 45% margin
  if (projectCost <= 15000) return 1.667; // 40% margin
  if (projectCost <= 25000) return 1.538; // 35% margin
  return 1.429; // 30% margin
}

export function calculateLaborCategoryTotals(
  category: LaborCategory,
  allResources: LaborResource[]
): LaborCategoryTotals {
  // Gracefully handle missing properties
  const estimatedTechDays = category.estimatedTechDays || 0;
  const clientRate = category.clientRate || 0;
  const assignedTechnicians = category.assignedTechnicians || [];
  const assignedSubcontractors = category.assignedSubcontractors || [];


  // Technician costs
  const techCustomerCost = estimatedTechDays * WORK_DAY_HOURS * clientRate * assignedTechnicians.length;
  
  const techCompanyCost = assignedTechnicians.reduce((acc, assigned) => {
    const resource = allResources.find(r => r.id === assigned.resourceId && r.type === 'technician');
    if (!resource) return acc;
    // Technicians are costed hourly
    const dailyCost = resource.costRate * WORK_DAY_HOURS;
    return acc + (dailyCost * estimatedTechDays);
  }, 0);

  // Subcontractor costs
  const subCustomerCost = assignedSubcontractors.reduce((acc, assigned) => {
    return acc + ((assigned.clientDailyRate || 0) * (assigned.estimatedDays || 0));
  }, 0);

  const subCompanyCost = assignedSubcontractors.reduce((acc, assigned) => {
    const resource = allResources.find(r => r.id === assigned.resourceId && r.type === 'subcontractor');
    if (!resource) return acc;
    // Subcontractors are costed daily
    return acc + (resource.costRate * (assigned.estimatedDays || 0));
  }, 0);

  const customerCost = techCustomerCost + subCustomerCost;
  const companyCost = techCompanyCost + subCompanyCost;
  const profit = customerCost - companyCost;
  const gpm = customerCost > 0 ? (profit / customerCost) * 100 : 0;

  return { customerCost, companyCost, profit, gpm };
}

export function calculateSimpleLaborTotals(option: QuoteOption, allResources: LaborResource[]): LaborCategoryTotals {
  if (!option.simpleLabor) return { customerCost: 0, companyCost: 0, profit: 0, gpm: 0 };
  
  const { numDays, rate, assignedTechnicians } = option.simpleLabor;

  const customerCost = (assignedTechnicians?.length || 0) * numDays * WORK_DAY_HOURS * rate;

  const companyCost = (assignedTechnicians || []).reduce((acc, assigned) => {
    const resource = allResources.find(r => r.id === assigned.resourceId && r.type === 'technician');
    if (!resource) return acc;
    const dailyCost = resource.costRate * WORK_DAY_HOURS;
    return acc + (dailyCost * numDays);
  }, 0);

  const profit = customerCost - companyCost;
  const gpm = customerCost > 0 ? (profit / customerCost) * 100 : 0;

  return { customerCost, companyCost, profit, gpm };
}


function calculateSimpleLaborCostAndSellPrice(option: QuoteOption, allResources: LaborResource[]): { laborCost: number; laborSellPrice: number } {
  if (!option.simpleLabor) return { laborCost: 0, laborSellPrice: 0 };
  const totals = calculateSimpleLaborTotals(option, allResources);
  return { laborCost: totals.companyCost, laborSellPrice: totals.customerCost };
}


function calculateDetailedLaborTotals(option: QuoteOption, allResources: LaborResource[]): { laborCost: number; laborSellPrice: number } {
    const laborCategories = option.laborCategories || [];
    const { totalLaborCost, totalLaborSellPrice } = laborCategories.reduce((acc, category) => {
        const categoryTotals = calculateLaborCategoryTotals(category, allResources);
        acc.totalLaborCost += categoryTotals.companyCost;
        acc.totalLaborSellPrice += categoryTotals.customerCost;
        return acc;
    }, { totalLaborCost: 0, totalLaborSellPrice: 0 });

    const laborSellPrice = option.laborSellPriceOverride ?? totalLaborSellPrice;

    return { laborCost: totalLaborCost, laborSellPrice };
}


export function calculateCustomTotals(
  option: QuoteOption,
  quote: Quote,
  allResources: LaborResource[]
): QuoteTotals {
  const items = option.areas?.flatMap(area => area.items) || [];
  
  // 1. Material Costs
  const materialCost = items.reduce((acc, item) => acc + (item.dealerCost || 0) * (item.quantity || 0), 0);
  const materialSellPrice = items.reduce((acc, item) => {
    const itemSellPrice = item.sellPriceOverride ?? item.msrp ?? 0;
    return acc + (itemSellPrice * (item.quantity || 0));
  }, 0);

  // 2. Labor Costs
  const { laborCost, laborSellPrice } = option.useSimpleLabor 
      ? calculateSimpleLaborCostAndSellPrice(option, allResources)
      : calculateDetailedLaborTotals(option, allResources);

  // 3. Shipping
  const shippingCharge = materialSellPrice * ((quote.shippingCustomerPercentage || 0) / 100);
  const companyShippingCost = materialCost * ((quote.shippingCompanyPercentage || 0) / 100);

  // 4. Subtotals and Discount
  const customerPrice = materialSellPrice + laborSellPrice + shippingCharge; // Pre-discount subtotal
  const discount = (quote.discountType === 'percentage' 
    ? customerPrice * ((quote.discountValue || 0) / 100) 
    : (quote.discountValue || 0));
  const taxableTotal = customerPrice - discount;

  // 5. Tax and Final Price
  const tax = taxableTotal * ((quote.taxRate || 0) / 100);
  const finalPrice = taxableTotal + tax;

  // 6. Profit Calculation
  const totalCompanyCost = materialCost + laborCost + companyShippingCost;
  const profit = taxableTotal - totalCompanyCost;
  const marginPercentage = taxableTotal > 0 ? (profit / taxableTotal) * 100 : 0;
  
  // 7. Invoice Breakdown
  let firstInvoice = 0;
  let secondInvoice = 0;
  if (customerPrice > 0) {
      const invoice1Subtotal = materialSellPrice + shippingCharge + (laborSellPrice * 0.25);
      const invoice2Subtotal = laborSellPrice * 0.75;
      
      const discountRatio1 = invoice1Subtotal / customerPrice;
      const discountRatio2 = invoice2Subtotal / customerPrice;

      const invoice1Discount = discount * discountRatio1;
      const invoice2Discount = discount * discountRatio2;

      const invoice1Taxable = invoice1Subtotal - invoice1Discount;
      const invoice2Taxable = invoice2Subtotal - invoice2Discount;
      
      const invoice1Tax = invoice1Taxable * ((quote.taxRate || 0) / 100);
      const invoice2Tax = invoice2Taxable * ((quote.taxRate || 0) / 100);

      firstInvoice = invoice1Taxable + invoice1Tax;
      secondInvoice = invoice2Taxable + invoice2Tax;
  }

  return {
    materialCost,
    laborCost,
    totalCompanyCost,
    customerPrice,
    discount,
    tax,
    finalPrice,
    marginPercentage,
    materialSellPrice,
    laborSellPrice,
    shippingCharge,
    firstInvoice,
    secondInvoice,
  };
}

export function calculateTieredTotals(
  option: QuoteOption,
  quote: Quote,
  allResources: LaborResource[]
): QuoteTotals {
  const { customerTypeForPricing, shippingCustomerPercentage, taxRate, shippingCompanyPercentage } = quote;

  // Tiered calculations are based on the original, non-tiered material and labor costs.
  const standardTotals = calculateCustomTotals(option, quote, allResources);
  const materialCost = standardTotals.materialCost;
  const { laborCost } = option.useSimpleLabor 
    ? calculateSimpleLaborCostAndSellPrice(option, allResources)
    : calculateDetailedLaborTotals(option, allResources);
  
  const companyShippingCost = materialCost * (shippingCompanyPercentage / 100);
  const totalCompanyCost = materialCost + laborCost + companyShippingCost;

  if (totalCompanyCost <= 0) {
    // Return zeroed-out totals if there's no cost.
    return {
        materialCost: 0, laborCost: 0, totalCompanyCost: 0, customerPrice: 0,
        discount: 0, tax: 0, finalPrice: 0, marginPercentage: 0,
        materialSellPrice: 0, laborSellPrice: 0, shippingCharge: 0,
        firstInvoice: 0, secondInvoice: 0,
    };
  }

  let gpm = 0;
  if (customerTypeForPricing === 'School') {
      gpm = 25;
  } else {
      if (totalCompanyCost <= 5000) gpm = 45;
      else if (totalCompanyCost <= 15000) gpm = 40;
      else if (totalCompanyCost <= 25000) gpm = 35;
      else gpm = 30;
  }

  const sellingPrice = totalCompanyCost / (1 - (gpm / 100));

  // Allocation for invoice/display purposes
  const materialSellPrice = materialCost * 1.25; 
  const shippingCharge = materialSellPrice * (shippingCustomerPercentage / 100);
  // The rest is allocated to labor to make the total match the GPM-calculated price.
  const laborSellPrice = sellingPrice - materialSellPrice - shippingCharge;

  // The tiered model does not use the user-entered discount.
  const discount = 0; 
  const customerPrice = sellingPrice; // subtotal is the selling price
  const taxableTotal = customerPrice - discount;
  const tax = taxableTotal * (taxRate / 100);
  const finalPrice = taxableTotal + tax;
  const marginPercentage = gpm; // The GPM is the target margin

  // Invoice breakdown based on these new totals
  const invoice1Subtotal = materialSellPrice + shippingCharge + (laborSellPrice * 0.25);
  const invoice1Taxable = invoice1Subtotal;
  const invoice1Tax = invoice1Taxable * (taxRate / 100);
  const firstInvoice = invoice1Taxable + invoice1Tax;
  
  const invoice2Subtotal = laborSellPrice * 0.75;
  const invoice2Taxable = invoice2Subtotal;
  const invoice2Tax = invoice2Taxable * (taxRate / 100);
  const secondInvoice = invoice2Taxable + invoice2Tax;

  return {
    materialCost,
    laborCost,
    totalCompanyCost,
    customerPrice,
    discount,
    tax,
    finalPrice,
    marginPercentage,
    materialSellPrice,
    laborSellPrice,
    shippingCharge,
    firstInvoice,
    secondInvoice
  };
}


export function calculateTotals(
  option: QuoteOption,
  quote: Quote,
  allResources: LaborResource[]
): QuoteTotals {
  if (quote.pricingModel === 'tiered') {
    return calculateTieredTotals(option, quote, allResources);
  }
  return calculateCustomTotals(option, quote, allResources);
}
