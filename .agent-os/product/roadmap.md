# Product Roadmap

> Last Updated: 2025-07-29
> Version: 1.0.0
> Status: Planning

This roadmap outlines the planned development phases for the Volteus project, prioritizing the core MVP features identified in the PRD.

---

## Phase 1: Core Quoting Engine (Weeks 1-2)

**Goal:** Build the essential end-to-end quoting functionality. This is the highest priority for the business.
**Success Criteria:** A user can successfully create a multi-option quote using a functional product library and send it to a client.

### Must-Have Features

- [ ] **Product Library UI:** Full CRUD functionality for products (add, edit, delete, import/export). `[Effort: L]`
- [ ] **Database Schema:** Design and implement tables for Products, Customers, Leads, and Quotes. `[Effort: M]`
- [ ] **Quote Setup Step:** Create the initial step of the quoting process (select customer, venue, team). `[Effort: S]`
- [ ] **Equipment Selection Step:** Build the UI for adding products from the library to a quote. `[Effort: L]`
- [ ] **Lead/Customer Management:** Basic UI for adding leads and manually converting them to customers. `[Effort: M]`

### Dependencies

- A clear data model for products and quotes.
- Decisions on the specific fields required for a "Product" from `questions-for-todd.md`.

---

## Phase 2: Finalize & Send Quote (Week 3)

**Goal:** Complete the quoting workflow, allowing a quote to be finalized and sent.
**Success Criteria:** A quote can be sent to a client via MailerSend, and the client can view and accept it.

### Must-Have Features

- [ ] **Labor Calculation Step:** Implement the UI for adding simple and detailed labor costs. `[Effort: M]`
- [ ] **Review & Send Step:** Build the final review screen with tiered pricing and shipping/tax edits. `[Effort: L]`
- [ ] **MailerSend Integration:** Integrate with the MailerSend API to email the quote. `[Effort: S]`
- [ ] **Client View & E-Signature:** Create the public-facing page for clients to view and digitally sign/accept a quote. `[Effort: L]`
- [ ] **Automated Customer Conversion:** Automatically convert a lead to a customer upon quote acceptance. `[Effort: XS]`

---

## Phase 3: AI & Project Management Foundations (Week 4)

**Goal:** Introduce AI assistance and begin building out the project management toolset.
**Success Criteria:** A user can generate a Scope of Work using AI, and a basic project is created from an accepted quote.

### Must-Have Features

- [ ] **AI-Assisted Scope of Work:** Integrate Gemini to generate a Scope of Work based on the quote's product list. `[Effort: M]`
- [ ] **Project Creation:** Automatically create a new project in the system when a quote is accepted. `[Effort: S]`
- [ ] **Basic Project View:** Create a simple, tabbed view for a project showing the equipment and scope. `[Effort: M]`

---

## Phase 4: Polish & User Roles

**Goal:** Implement user roles, security, and the core application shell.
**Success Criteria:** Role-based access control is functional, and the main navigation is in place.

### Must-Have Features

- [ ] **Authentication & RBAC:** Implement Google SSO and the defined user roles (Admin, Sales, Tech). `[Effort: M]`
- [ ] **Application Shell:** Build the main sidebar and header navigation. `[Effort: S]`
- [ ] **Settings Page:** Basic version for user profile management. `[Effort: S]`

---

## Phase 5: Technician & Reporting MVP

**Goal:** Build the initial version of the mobile view for technicians and basic reporting.
**Success Criteria:** A technician can view their assigned projects on a mobile device, and a sales commission report can be generated.

### Must-Have Features

- [ ] **Technician Mobile View:** A read-only view of project details. `[Effort: M]`
- [ ] **Sales Commission Report:** A simple report showing sales commission based on project profitability. `[Effort: S]`
