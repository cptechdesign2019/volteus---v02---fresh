# Legacy UI Style Reference – CP Quoting Tool V2
*Date created – 2025-07-29*

> This document captures the key visual design tokens, component inventory and layout patterns from the legacy **CP Quoting Tool V2** application.  
> Use it as a reference when rebuilding screens in the new Agent OS–compliant Volteus project.  
> **Do not** copy code – re-implement with modern shadcn/ui primitives & Tailwind 4 using these specs.

---

## 1  Brand Colours
| Token | HSL (from globals.css) | Approx HEX | Usage |
|-------|-----------------------|-----------|-------|
| **Primary** | `225 100% 58%` | `#3B60FF` | Buttons, links, charts |
| **Background** | `210 40% 96%` | `#F1F5F9` | App background |
| **Foreground** | `222 84% 4.9%` | `#0F172A` | Primary text |
| **Secondary** | `210 40% 96%` | `#F1F5F9` | Card & sidebar bg (light) |
| **Accent** | `34 100% 50%` | `#FFAA00` | Highlights, price badge |
| **Destructive** | `0 84% 60%` | `#EF4444` | Delete / danger actions |

> Dark-mode overrides are defined in `.dark` variants – keep same hue, adjust lightness.

### Additional Semantic Tokens
* `--border` / `--input`: soft neutral gray borders  
* `--ring`: same hue as **primary** for focus outline  
* Sidebar has its own namespace (`--sidebar-*`) – consider merging with standard tokens when redesigning.

---

## 2  Typography
| Context | Font Family | Size (Tailwind scale) | Weight |
|---------|-------------|-----------------------|--------|
| Headings | `Montserrat` | `text-2xl → text-4xl` | `700` |
| Body | `Montserrat` | `text-sm / text-base` | `400` |
| Code / Mono | Browser default `monospace` | — | — |

* Use Tailwind font stack: `font-sans` mapped to CSS variable `--font-sans` (Montserrat).
* Line-height defaults (`leading-normal`) worked well – keep.

---

## 3  Spacing & Radius Tokens
| Token | Value |
|-------|-------|
| `--radius` | `0.5rem` (8 px) |
| Tailwind scale | `2 / 4 / 6 / 8 / 12` px margins & gaps dominate |
| Card padding | `p-6` (24 px) desktop, `p-4` mobile |

> Maintain 8-px baseline grid.

---

## 4  Component Inventory (61 files)
Below is a condensed list. Files live under `src/legacy-imported/components/`.  
Focus on **behavior & data** – visual polish will be rebuilt with shadcn/ui.

| Category | Component | Notes |
|----------|-----------|-------|
| Navigation | `app-sidebar.tsx` | Collapsible sidebar with role-based links |
| Dialogs | `add-product-dialog`, `add-contact-dialog`, `ai-quote-dialog`, `signature-dialog`, etc. | Use Radix `Dialog` + Form primitives |
| Sheets | `quote-activity-sheet`, `customer-detail-sheet` | Slide-over panels (Radix `Sheet`) |
| Forms | `new-quote-form`, `labor-editor`, `quote-editor` | Large multi-step forms (will need Formik / Zod) |
| Display | `quote-summary`, `quote-builder-page` | Complex read-only views |
| Utility | `tinymce-editor`, `client-only-pdf-control` | 3rd-party integrations |

See full file list in `/src/legacy-imported/components` for granular reference.

---

## 5  Layout Patterns
1. **Desktop Grid**  – 12-column, `max-w-[1440px]`, gutters `gap-6`.  
2. **Cards** – max-width `540px`, border-radius `lg`, shadow `sm`.  
3. **Dialogs** – widths `sm` (480px) or `lg` (640px).  
4. **Sidebar** – 240 px fixed, collapses to icons at `md`.

---

## 6  Keep vs Modernize
| Keep | Modernize / Drop |
|------|-----------------|
| Montserrat font | Gradient backgrounds |
| Primary colour `#162944` | Heavy box-shadows |
| 8-px spacing grid | Tiny margin variants (`m-1`, etc.) |
| Dialog slide/scale animations | Custom CSS transitions – use `tailwindcss-animate` |

---

## 7  Implementation Notes
* Use **shadcn/ui generator** for Button, Card, Dialog, Sheet, etc.  
* Map colour tokens to Tailwind config (`theme.extend.colors.primary`, …).  
* Implement dark-mode with `class` strategy (already in globals).  
* Remove duplicated sidebar colour tokens – unify under semantic palette.  
* Create **Storybook** stories as you rebuild each component.

---

**File location:** `.agent-os/specs/2025-07-29-legacy-ui-style-reference.md`

*Reviewed & approved by Product on 2025-07-29* 