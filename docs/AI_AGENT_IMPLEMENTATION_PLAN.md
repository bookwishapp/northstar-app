# AI Agent Implementation Plan for North Star Repo
## March 11, 2026

## Overview
This plan orchestrates parallel AI agents to fix all 12 critical issues from GAP_REPORT.md. No improvisation, refactoring, or business decisions allowed. All changes are mechanical implementations of specified requirements.

## Key Principles from CLAUDE.md
- No pre-existing errors - all errors are from AI work, must be owned and fixed
- TypeScript strictly - no `any` types
- No console.log in committed code
- No TODO comments - implement or document gap
- No direct DB writes in pages - use API routes
- Run `npm run build` before committing
- Never push to remote unless explicitly asked

---

## Database Migration (Sequential - Do First)

### Agent 0: Database Schema Changes
**Task:** Create and apply single migration
**Duration:** 15 minutes
**Files to create/modify:**
- `prisma/schema.prisma`

**Changes:**
```prisma
model Order {
  // Issue #5: Add recipient address collection
  recipientAddress  Json?  // { name, line1, line2, city, state, zip, country }
}

model Template {
  // Issue #4: Configurable return address
  returnAddress         String?
  // Issue #3: Envelope background upload
  envelopeBackgroundKey String?
  // Issue #11: Email header image
  emailHeaderKey        String?
  // Issue #7: Configurable font size (reduced default)
  fontSize              String    @default("14px")
  // Issue #10: Date configuration
  letterDateFormat      String    @default("current") // "current" | "custom" | "holiday"
  letterDateCustom      String?
}
```

**Commands:**
```bash
npx prisma migrate dev --name add-critical-fields
npm run build
```

---

## Parallel Agent Assignments

### Agent Group A: Form & Data Collection (3 agents)

#### Agent A1: Personalization Fields (Issues #1, #12)
**Files to modify:**
- `components/claim/ClaimForm.tsx`
- `app/api/claim/[token]/route.ts`
- `lib/ai.ts`
- `lib/prompt-template.ts`
- `lib/handlebars-utils.ts`

**Tasks:**
1. Make ClaimForm render fields dynamically from `template.personalizationFields`
2. Store all collected data in `order.recipientDetails` JSON
3. Pass complete personalization context to AI generation
4. Update Handlebars to use all available fields

**No business decisions:** Use exact field structure from template

#### Agent A2: Address Collection (Issue #5)
**Files to modify:**
- `components/claim/ClaimForm.tsx` (address section)
- `app/api/claim/[token]/route.ts` (store address)

**Tasks:**
1. Add recipient address fields to claim form
2. Store as `order.recipientAddress` JSON
3. Include standard fields: name, line1, line2, city, state, zip, country

**No business decisions:** Use standard address format

#### Agent A3: Date Configuration (Issue #10)
**Files to modify:**
- `app/admin/templates/[id]/page.tsx`
- `lib/ai.ts`
- `lib/prompt-template.ts`

**Tasks:**
1. Add date configuration UI (dropdown: current/custom/holiday)
2. Pass configured date to AI context
3. Use template's `letterDateFormat` and `letterDateCustom` fields

**No business decisions:** Three exact options as specified

### Agent Group B: PDF Generation (2 agents)

#### Agent B1: PDF Styling Fixes (Issues #7, #8, #9)
**Files to modify:**
- `lib/pdf.ts`

**CSS changes (exact):**
```css
/* Issue #7: Reduce font size */
body { font-size: 14px; }

/* Issue #8: Increase image sizes */
.character-image { width: 200px; height: auto; }
.header-image { width: 100%; max-width: 400px; }

/* Issue #9: Wax seal on last page only */
.wax-seal { display: none; }
@page :last { .wax-seal { display: block; } }
```

**No business decisions:** Use exact CSS provided

#### Agent B2: PDF Address Integration (Issue #4)
**Files to modify:**
- `lib/pdf.ts`

**Tasks:**
1. Use `template.returnAddress` in envelope generation
2. Use `order.recipientAddress` for recipient section
3. Ensure consistent formatting

**No business decisions:** Use addresses exactly as stored

### Agent Group C: Upload Features (2 agents)

#### Agent C1: Envelope Background Upload (Issue #3)
**Files to modify:**
- `app/admin/templates/[id]/page.tsx`
- `lib/pdf.ts`

**Tasks:**
1. Add S3 upload UI for envelope background
2. Store key in `template.envelopeBackgroundKey`
3. Apply background image in PDF generation

**No business decisions:** Standard S3 upload pattern

#### Agent C2: Email Header Upload (Issue #11)
**Files to modify:**
- `app/admin/templates/[id]/page.tsx`
- `lib/email.ts`

**Tasks:**
1. Add S3 upload UI for email header
2. Store key in `template.emailHeaderKey`
3. Include header image in email template

**No business decisions:** Standard S3 upload pattern

### Agent Group D: Documentation (1 agent)

#### Agent D1: Margin Documentation (Issue #6)
**Files to modify:**
- `lib/pdf.ts` (add comments)

**Tasks:**
1. Add CSS comments explaining margin behavior
2. Clarify content vs decoration margins
3. Document which margins apply to images vs text

**No business decisions:** Documentation only

### Agent Group E: Database Content (1 agent)

#### Agent E1: Prompt Content Updates (Issue #2)
**Note:** Database updates only - NO CODE CHANGES
**Task:** Document SQL updates needed for prompt improvement

**Create file:** `docs/PROMPT_UPDATES.sql`
```sql
-- Updates to improve literary quality
-- Apply via admin UI or direct database update
UPDATE Template
SET letterPrompt = '...',  -- Enhanced prompt with style examples
    storyPrompt = '...'     -- Enhanced prompt with narrative guidance
WHERE id IN (SELECT id FROM Template);
```

**No business decisions:** Prompt improvements only

---

## Execution Timeline

```
Hour 0: Database Migration (Agent 0)
        └── Unblocks all other agents

Hours 1-3: Parallel Execution
├── Group A (3 agents): Forms & Data
│   ├── A1: Personalization
│   ├── A2: Addresses
│   └── A3: Dates
│
├── Group B (2 agents): PDF
│   ├── B1: Styling
│   └── B2: Addresses
│
├── Group C (2 agents): Uploads
│   ├── C1: Envelope
│   └── C2: Email
│
├── Group D (1 agent): Documentation
│   └── D1: Margins
│
└── Group E (1 agent): Database
    └── E1: Prompts SQL

Hour 4: Integration Testing
```

---

## Agent Spawn Commands

### Sequential (must complete first):
```
Agent 0: Implement database migration from AI_AGENT_IMPLEMENTATION_PLAN.md section "Database Migration"
```

### Parallel (after Agent 0):
```
Agent A1: Implement Issues #1,#12 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent A1: Personalization Fields"
Agent A2: Implement Issue #5 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent A2: Address Collection"
Agent A3: Implement Issue #10 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent A3: Date Configuration"
Agent B1: Implement Issues #7,#8,#9 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent B1: PDF Styling Fixes"
Agent B2: Implement Issue #4 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent B2: PDF Address Integration"
Agent C1: Implement Issue #3 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent C1: Envelope Background Upload"
Agent C2: Implement Issue #11 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent C2: Email Header Upload"
Agent D1: Implement Issue #6 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent D1: Margin Documentation"
Agent E1: Create SQL for Issue #2 from AI_AGENT_IMPLEMENTATION_PLAN.md section "Agent E1: Prompt Content Updates"
```

---

## Verification Checklist

### Each Agent Must:
- [ ] Read only their assigned section
- [ ] Modify only listed files
- [ ] Make no business decisions
- [ ] Run `npm run build` after changes
- [ ] Report completion with file list

### Final Integration:
- [ ] All 12 issues addressed
- [ ] Build passes
- [ ] No new dependencies added
- [ ] No refactoring performed
- [ ] No console.log statements
- [ ] No TODO comments

---

## Issue to Agent Mapping

| Issue | Description | Agent | Status |
|-------|-------------|-------|--------|
| #1 | Incomplete personalization fields | A1 | Pending |
| #2 | Poor stylistic quality (prompts) | E1 | Pending |
| #3 | Missing envelope image upload | C1 | Pending |
| #4 | Inconsistent return addresses | B2 | Pending |
| #5 | Missing recipient address field | A2 | Pending |
| #6 | Unclear margin application | D1 | Pending |
| #7 | Font size too large | B1 | Pending |
| #8 | Letter images too small | B1 | Pending |
| #9 | Wax seal on all pages | B1 | Pending |
| #10 | Incorrect date handling | A3 | Pending |
| #11 | Missing holiday email header | C2 | Pending |
| #12 | No personalization beyond name | A1 | Pending |

---

## Notes

- This plan requires 10 parallel agents after initial migration
- No agent dependencies except initial migration
- Total execution time: ~4 hours
- All changes are mechanical implementations
- No creative decisions or refactoring allowed