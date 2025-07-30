// src/lib/types.ts

export interface Product {
  id: string;
  name: string;
  description: string;
  modelNumber: string;
  dealerCost: number;
  msrp: number;
  category: string;
  brand: string;
  imageUrl: string;
}

export interface QuoteItem extends Product {
  quantity: number;
  sellPriceOverride?: number;
}

export interface QuoteArea {
  id:string;
  name: string;
  items: QuoteItem[];
}

export type CustomerType = 'Residential' | 'Commercial' | 'School';

export interface QuoteTotals {
  materialCost: number;
  laborCost: number;
  totalCompanyCost: number;
  customerPrice: number; // Subtotal before discount
  discount: number;
  tax: number;
  finalPrice: number;
  marginPercentage: number;
  materialSellPrice: number;
  laborSellPrice: number;
  shippingCharge: number;
  firstInvoice: number;
  secondInvoice: number;
}

export interface Address {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  label?: string; // e.g., 'Main Office', 'Warehouse'
}

export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  role?: string; // e.g., 'Project Manager', 'Billing Contact'
}

export interface CustomerInfo {
  id: string; // Firestore document ID
  userId: string;
  displayName: string;
  companyName?: string;
  primaryContact: Contact;
  additionalContacts?: Contact[];
  billingAddress: Address;
  projectAddress: Address;
  additionalAddresses?: Address[];
  projectType: 'Residential' | 'Commercial';
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'pending-changes' | 'accepted' | 'expired';

// New Labor Types
export interface Technician {
  id: string;
  name: string;
  role: 'Engineer' | 'Lead Tech' | 'Install Tech';
  costRate: number; // hourly cost
  type: 'technician';
}

export interface Subcontractor {
  id: string; // uuid
  name: string;
  costRate: number; // daily cost
  type: 'subcontractor';
}

export type LaborResource = Technician | Subcontractor;

export interface AssignedResource {
  resourceId: string;
}

export interface AssignedSubcontractor {
    resourceId: string;
    estimatedDays: number;
    clientDailyRate: number;
}

export interface LaborCategoryTotals {
  customerCost: number;
  companyCost: number;
  profit: number;
  gpm: number;
}

export interface LaborCategory {
  id: 'design' | 'programming' | 'prewire' | 'install';
  name: string;
  clientRate: number; // hourly rate for customer (for technicians)
  estimatedTechDays: number; // for technicians
  assignedTechnicians: AssignedResource[];
  assignedSubcontractors: AssignedSubcontractor[];
  totals: LaborCategoryTotals;
}

export interface SimpleLabor {
  numDays: number;
  rate: number;
  assignedTechnicians: AssignedResource[];
}

export interface QuoteOption {
  id: string;
  name: string;
  areas: QuoteArea[];
  laborCategories: LaborCategory[];
  scopeOfWork: string;
  totals: QuoteTotals;
  laborSellPriceOverride?: number;
  useSimpleLabor?: boolean;
  simpleLabor?: SimpleLabor;
}

export type ExpirationTimeline = 'Never' | '30 Days' | '60 Days' | '90 Days';

export type PricingModel = 'custom' | 'tiered';

export interface ChangeLogEntry {
  timestamp: string;
  description: string;
  author?: string;
}

export interface QuoteView {
    timestamp: string;
    // Potentially add ipAddress, userAgent in the future
}

export interface Quote {
  id: string;
  userId: string;
  quoteNumber: string;
  quoteName: string;
  status: QuoteStatus;
  
  customerId: string; // Link to the customer in the 'customers' collection
  customerType: 'new' | 'existing'; // This might become less relevant
  projectType: 'Residential' | 'Commercial';
  customerTypeForPricing: CustomerType;
  pricingModel: PricingModel;
  salesRep?: string;
  salesAssistant?: string;

  companyName?: string;
  primaryContact: Contact;
  billingAddress: Address;
  useBillingForProject: boolean;
  projectAddress: Address;
  additionalContacts: Contact[];

  options: QuoteOption[];
  originalOptionsForDiff?: QuoteOption[]; // Snapshot for change tracking
  
  shippingCustomerPercentage: number;
  shippingCompanyPercentage: number;
  taxRate: number;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  expirationTimeline: ExpirationTimeline;
  sentAt?: string; // ISO date string
  expiresAt?: string; // ISO date string
  acceptedAt?: string;
  acceptedOptionId?: string;
  signature?: string;
  notes?: string;
  revisionNumber?: number;
  changeLog?: ChangeLogEntry[];
  viewHistory?: QuoteView[];

  subcontractors: Subcontractor[];
  
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  updatedBy?: string;
}

// --- Project Types ---
export type ProjectStatus = 'Pending Deposit' | 'Equipment Ordering' | 'Pending Scheduling' | 'Scheduled' | 'In Progress' | 'Final Invoice' | 'Completed' | 'On Hold';

export interface ProjectEquipmentItem extends QuoteItem {
  notes?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}

export interface ProjectArea {
  id: string;
  name: string;
  items: ProjectEquipmentItem[];
}

export const taskCategories = [
    'Project Prep',
    'Pre-wire',
    'Installation',
    'Setup & Configuration',
    'Testing',
    'Commissioning',
    'Clean-Up',
    'Training',
    'Post Project',
    'Admin'
] as const;

export type TaskCategory = (typeof taskCategories)[number];


export interface ProjectTask {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
    assignedTo?: string; // User ID or name
    category: TaskCategory;
    estimatedHours: number;
}

export interface TeamMember {
  name: string;
  email: string;
}

export interface ProjectCommunication {
  id: string;
  type: 'internal-note' | 'email-log';
  author: string;
  timestamp: string;
  // For internal notes
  content?: string;
  mentions?: string[]; // Array of mentioned user IDs/names
  // For emails
  emailTo?: string;
  emailCc?: string;
  emailSubject?: string;
  emailBody?: string;
}


export interface ProjectFile {
    id: string;
    name: string;
    url: string; // Could be a Google Drive link
    type: 'before-photo' | 'after-photo' | 'document' | 'other';
    uploadedAt: string;
}

export interface ProjectExpense {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: 'equipment' | 'materials' | 'travel' | 'other';
}

export interface ProjectFinancials extends QuoteTotals {
    actualExpenses: ProjectExpense[];
    actualProfit?: number;
    actualMargin?: number;
}

export interface Project {
  id: string;
  userId: string;
  quoteId: string;
  customerId: string;
  projectNumber: string;
  projectName: string;
  status: ProjectStatus;

  // Copied from Quote/Customer for easy access
  customerInfo: {
    displayName: string;
    companyName?: string;
    primaryContact: Contact;
    projectAddress: Address;
  };
  salesTeam: {
    salesRep?: string;
    salesAssistant?: string;
  };

  // Accepted option details
  equipment: ProjectArea[];
  scopeOfWork: string;
  financials: ProjectFinancials;
  
  // Labor details
  useSimpleLabor?: boolean;
  simpleLabor?: SimpleLabor;
  labor: LaborCategory[];


  tasks?: ProjectTask[];
  communications?: ProjectCommunication[];
  files?: ProjectFile[];
  
  scheduledStartDate?: string;
  scheduledEndDate?: string;

  createdAt: string; // ISO date string when the project was created
}
