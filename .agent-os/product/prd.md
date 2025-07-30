# Project Blueprint & Requirement Documents (v 1.1)

Project Name: Volteus (Working Title: Volteus)
Version: 1.1 Date: 20 Jul 2025
Product Owners: Todd Church, Aaron Zink

---

## Part 1 · Project Charter

### 1.1 Project Vision & Purpose    
Design and build a bespoke, all-in-one business-operations platform for Clearpoint Technology + Design—covering the entire client lifecycle from first lead to final project analysis.

### 1.2 Key Features (MVP)
- Quote-to-Project engine with 5-step quoting workflow
- Sales Funnel – Leads & Customers management
- Product Library with search-first interface and CSV import/export
- Project Management dashboard for active jobs
- Technician Mobile View for field staff
- Reporting & KPI dashboards
- Security & Access Control (Google SSO, RBAC, multi-tenant isolation)
- Settings & Administration (branding, rates, user management)

### 1.3 Target Users & Stakeholders
- Super Admin (business owner / system admin)
- Project Manager
- Sales Representative
- Lead Technician
- Technician (field user – mobile first)
- External Customer (read-only quote / project updates)

### 1.4 Core Technology Stack
Refer to `.agent-os/standards/tech-stack.md` (Next.js 15, Supabase/PostgreSQL, Tailwind CSS v3, Render.com hosting, etc.).

---

## Part 2 · Functional Requirements & User Stories

### 2.1 Quote-to-Project Engine (5-Step Workflow)
**Objective:** Enable staff to build multi-option quotes quickly and convert accepted quotes directly into managed projects.

#### Functional Requirements
- **FR-1 (Setup):** System shall auto-generate a sequential quote number, associate a customer (existing or new), venue, and internal team members.
- **FR-2 (Equipment):** Users shall add products by drag-and-drop into Areas, support multiple option tabs, and view live cost / profit calculations.
- **FR-3 (Labor):** Users shall choose between Simple and Detailed labor modes and apply subcontractor markup rules.
- **FR-4 (Scope of Work):** System shall generate draft scope text via AI prompt and allow rich-text editing before saving.
- **FR-5 (Review & Send):** System shall render a PDF, send via MailerSend, and capture e-signature acceptance. Accepted quotes automatically create a new Project record.

#### User Stories
- *As a Sales Representative, I want to create a new quote in under five minutes so that I can respond to leads quickly.*
- *As a Sales Representative, I want to compare multiple equipment options within one quote so that customers can choose their preferred tier.*
- *As a Project Manager, I want accepted quotes to auto-create a Project so that no data is re-entered.*
- *As an External Customer, I want to e-sign the quote digitally so that I can approve work without printing paperwork.*

---

### 2.2 Product Library
**Objective:** Maintain a centralized, searchable catalog of all products, pricing, and related data used throughout the platform.

#### Functional Requirements
- **FR-1:** System shall display a search-first table with sortable columns (Image, Brand, Category, Name, SKU, Dealer Cost, MSRP).
- **FR-2:** Users shall import products in bulk via CSV, with duplicate-handling and field-mapping wizard.
- **FR-3:** Users shall export any filtered product set to CSV.
- **FR-4:** System shall provide a full edit modal for each product, including MAP pricing, distributors, and images.
- **FR-5:** Products shall be categorizable by brand and category for filtering and reporting.

#### User Stories
- *As a Project Manager, I want to search the product catalog by SKU or keyword so that I can find items instantly.*
- *As a Purchasing Coordinator, I want to import updated price lists from suppliers via CSV so that product costs stay accurate.*
- *As a Sales Representative, I want product data to auto-populate when adding equipment to a quote so that I don’t re-type details.*
- *As a Finance Admin, I want to export pricing data to CSV so that I can analyze margins in Excel.*

---

### 2.3 Project Management Dashboard
**Objective:** Provide real-time oversight of active projects from quote acceptance through completion and invoicing.

#### Functional Requirements
- **FR-1:** System shall display a dashboard with project status cards showing progress, team assignments, and key deadlines.
- **FR-2:** Users shall update project status, add notes, and attach photos/documents to project records.
- **FR-3:** System shall track labor hours, material usage, and project costs against original quote estimates.
- **FR-4:** Users shall generate progress reports and client communications directly from project data.
- **FR-5:** System shall trigger notifications for overdue tasks, budget overruns, and milestone completions.

#### User Stories
- *As a Project Manager, I want to see all active projects on one dashboard so that I can prioritize my daily work.*
- *As a Lead Technician, I want to update project status from the field so that the office knows our progress.*
- *As a Project Manager, I want to track actual costs vs. quoted costs so that I can identify projects going over budget.*
- *As a Customer, I want to receive automated progress updates so that I know my project is moving forward.*

---

### 2.4 Security & Access Control
**Objective:** Ensure data security, role-based access, and multi-tenant isolation for future expansion.

#### Functional Requirements
- **FR-1:** System shall authenticate users via Google SSO with session management and automatic logout.
- **FR-2:** System shall enforce role-based permissions (Super Admin, Project Manager, Sales, Lead Tech, Technician) with granular access controls.
- **FR-3:** System shall implement multi-tenant architecture using tenant_id with Supabase Row Level Security (RLS).
- **FR-4:** System shall require additional password verification for sensitive pages (customer data, financial reports).
- **FR-5:** System shall log all user actions, login attempts, and data access for audit trails.

#### User Stories
- *As a Super Admin, I want to control what features each role can access so that sensitive data stays protected.*
- *As any User, I want to log in with my Google account so that I don't need another password to remember.*
- *As a Business Owner, I want all user actions logged so that I can audit system usage if needed.*
- *As a Future Client, I want my company's data isolated from other tenants so that my information stays private.*

---

### 2.5 Technician Mobile View
**Objective:** Provide field technicians with mobile-optimized tools to update project status, capture photos, and access essential project information.

#### Functional Requirements
- **FR-1:** System shall provide a mobile-responsive interface optimized for smartphones and tablets.
- **FR-2:** Users shall capture and upload photos directly from mobile device camera with automatic project association.
- **FR-3:** System shall allow technicians to update task completion status, add notes, and log time spent on-site.
- **FR-4:** Users shall access project details, equipment lists, and scope of work documents offline when connectivity is poor.
- **FR-5:** System shall sync mobile updates automatically when internet connection is restored.

#### User Stories
- *As a Technician, I want to take photos of completed work so that the office can see our progress without me calling.*
- *As a Lead Technician, I want to mark tasks complete from my phone so that the project status updates in real-time.*
- *As a Technician, I want to view the equipment list on my phone so that I know what materials I need to bring.*
- *As a Project Manager, I want to see field updates immediately so that I can coordinate with customers and suppliers.*

---

### 2.6 Reporting & KPI Dashboards
**Objective:** Provide business intelligence through customizable reports and key performance indicators for data-driven decision making.

#### Functional Requirements
- **FR-1:** System shall generate automated reports for sales performance, project profitability, and team productivity.
- **FR-2:** Users shall create custom date-range reports with filtering by customer, project type, or team member.
- **FR-3:** System shall display real-time KPI dashboards showing revenue, profit margins, project completion rates, and customer satisfaction.
- **FR-4:** Users shall export all reports to PDF and CSV formats for external analysis or client presentations.
- **FR-5:** System shall provide visual charts and graphs for trend analysis and performance comparisons.

#### User Stories
- *As a Business Owner, I want to see monthly profit margins so that I can identify our most profitable service types.*
- *As a Sales Manager, I want to track quote-to-close rates so that I can coach my team on improvement areas.*
- *As a Project Manager, I want to compare estimated vs. actual project costs so that I can improve future quoting accuracy.*
- *As a Finance Admin, I want to export financial data to CSV so that I can import it into our accounting system.*

---

### 2.7 Settings & Administration
**Objective:** Provide comprehensive system configuration, user management, and business rule customization for operational flexibility.

#### Functional Requirements
- **FR-1:** Super Admins shall manage user accounts, role assignments, and access permissions through an intuitive interface.
- **FR-2:** System shall allow customization of company branding (logo, colors, email templates) and labor rates by role/region.
- **FR-3:** Users shall configure automated workflows, notification rules, and approval processes for quotes and projects.
- **FR-4:** System shall provide backup/restore functionality and API key management for third-party integrations.
- **FR-5:** Users shall define custom project status labels, equipment categories, and business rules specific to company operations.

#### User Stories
- *As a Super Admin, I want to add new team members and assign their roles so that they can access appropriate system features.*
- *As a Business Owner, I want to update our labor rates seasonally so that quotes reflect current market pricing.*
- *As a Finance Admin, I want to customize approval workflows so that large quotes require management sign-off before sending.*
- *As a Marketing Manager, I want to update email templates so that our client communications match our current branding.*

---

### 2.8 Sales Funnel – Leads & Customers (Future Phase)
**Objective:** Manage the complete sales pipeline from lead capture through customer relationship management (initially integrated with Monday.com via API).

#### Functional Requirements
- **FR-1:** System shall integrate with Monday.com API to synchronize lead and customer data during initial implementation.
- **FR-2:** Users shall capture leads through web forms, manual entry, and third-party integrations (Jotform, website contact forms).
- **FR-3:** System shall track lead source, conversion rates, and sales funnel progression with automated follow-up reminders.
- **FR-4:** Users shall maintain customer profiles with contact history, project history, and communication preferences.
- **FR-5:** System shall provide password-protected customer directory with search, filtering, and relationship management tools.

#### User Stories
- *As a Sales Representative, I want leads from our website to automatically appear in my dashboard so that I can follow up quickly.*
- *As a Sales Manager, I want to track which lead sources convert best so that I can focus marketing spend effectively.*
- *As a Project Manager, I want to see a customer's full project history so that I can reference past work when planning new quotes.*
- *As a Business Owner, I want customer data protected by additional authentication so that sensitive information stays secure.*

---

## Part 3 · MVP Timeline & Milestones

Below is a high-level 4-week sprint plan modeled after the original prototype but updated for the refined feature priorities.

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| **1** | Foundation & Security | • Project setup, repo CI/CD<br/>• Google SSO auth flow<br/>• RBAC roles & Supabase RLS<br/>• Settings shell (branding, labor rates) |
| **2** | Product Library (Data) | • Search-first table UI<br/>• CSV import wizard (happy path)<br/>• CSV export<br/>• Basic product edit modal |
| **3** | Quote-to-Project Engine (Core) | • Step 0 Setup & Step 1 Equipment pages<br/>• Drag-&-drop Areas, live cost maths<br/>• AI scope draft (stub)<br/>• PDF generation pipeline |
| **4** | Quote Flow Finish & Project Mgmt α | • Labor, Scope, Review & Send steps<br/>• E-signature acceptance → creates Project<br/>• Minimal Project dashboard list view<br/>• Internal demo & stakeholder review |

**Stretch / Post-MVP (Weeks 5-6)**
- Technician Mobile View (offline sync prototype)
- Reporting & KPI dashboards v0 (revenue, profit)
- Monday.com lead sync service

### Milestone Acceptance Criteria
1. All Week 1–4 deliverables deployed to staging on Render.com
2. Happy-path demo showing: add product → build quote → customer e-sign → project appears in dashboard
3. Basic security tests (role access, tenant isolation) pass
4. Product Library supports >1 000 items import/export without errors


 