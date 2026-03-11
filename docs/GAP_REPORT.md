# North Star Postal - Gap Analysis Report
## March 11, 2026

## Executive Summary
The system is functional but has 12 critical gaps affecting user experience, personalization, and visual quality. ALL issues are considered CRITICAL and must be addressed for proper system operation.

---

## ISSUE 1: Incomplete Personalization Fields in Claim Form
**Current State:** Only `recipientName` and `recipientAge` are collected
**Expected State:** Should collect all fields defined in `template.personalizationFields`
**Root Cause:** ClaimForm component doesn't render dynamic fields from `personalizationFields`
**Impact:** HIGH - AI prompts can't use personalization data they're designed for

### Required Changes:
- Update `components/claim/ClaimForm.tsx` to dynamically render fields from `template.personalizationFields`
- Store collected data in `order.recipientDetails` JSON field
- Pass all personalization data to AI generation

### Files to Modify:
- `components/claim/ClaimForm.tsx`
- `app/api/claim/[token]/route.ts`
- `lib/ai.ts`

---

## ISSUE 2: Poor Stylistic Quality of Generated Content
**Current State:** Generated letters and stories lack literary quality
**Expected State:** Engaging, well-written content appropriate for holiday theme
**Root Cause:** AI prompts are not optimized; no temperature/style parameters

### Required Changes:
- Refine `letterPrompt` and `storyPrompt` in templates
- Add temperature and style parameters to OpenAI calls
- Include example outputs in prompts for style guidance
- Consider using GPT-4 instead of GPT-3.5

### Files to Modify:
- `lib/ai.ts` (OpenAI parameters)
- Database templates (prompt refinement)

---

## ISSUE 3: Missing Envelope Image Upload
**Current State:** No field in Template model for envelope images
**Expected State:** Admin can upload custom envelope backgrounds
**Root Cause:** Schema missing `envelopeBackgroundKey` field

### Required Changes:
- Add `envelopeBackgroundKey` to Template schema
- Add upload UI in template editor
- Update envelope PDF generation to use custom image

### Files to Modify:
- `prisma/schema.prisma`
- `app/admin/templates/[id]/page.tsx`
- `lib/pdf.ts`

---

## ISSUE 4: Inconsistent Return Addresses
**Current State:** Hardcoded "North Pole" in envelope, different in letter
**Expected State:** Consistent, configurable return address
**Root Cause:** Return address hardcoded in multiple places

### Required Changes:
- Add `returnAddress` field to Template model
- Use consistent address in both envelope and letter
- Make configurable per holiday

### Files to Modify:
- `prisma/schema.prisma`
- `lib/pdf.ts` (envelope and letter generation)

---

## ISSUE 5: Missing Sender Address Field
**Current State:** No way to input sender's address
**Expected State:** Collect sender address for both digital and physical orders
**Root Cause:** Schema and UI missing sender address fields

### Required Changes:
- Add `senderAddress` JSON field to Order model
- Add sender address section to claim form
- Include in PDF generation

### Files to Modify:
- `prisma/schema.prisma`
- `components/claim/ClaimForm.tsx`
- `lib/pdf.ts`

---

## ISSUE 6: Unclear Margin Application
**Current State:** Margins defined but unclear if applied to images
**Expected State:** Clear margin behavior for text and images
**Root Cause:** CSS implementation doesn't clearly separate content/decoration margins

### Required Changes:
- Separate content margins from page margins
- Document margin behavior
- Add visual margin guides in admin preview

### Files to Modify:
- `lib/pdf.ts` (CSS clarification)
- Documentation update

---

## ISSUE 7: Font Size Too Large
**Current State:** Font size appears oversized in generated PDFs
**Expected State:** Appropriate, readable font size
**Root Cause:** Fixed font size not accounting for different content lengths

### Required Changes:
- Reduce base font size from current setting
- Make font size configurable per template
- Add font size to Template model

### Files to Modify:
- `lib/pdf.ts` (CSS font-size)
- `prisma/schema.prisma` (add fontSize field)

---

## ISSUE 8: Letter Images Too Small
**Current State:** Character/header images render too small
**Expected State:** Properly sized, prominent images
**Root Cause:** Fixed image dimensions in CSS

### Required Changes:
- Increase image dimensions in PDF CSS
- Make image sizes configurable
- Test with different image aspect ratios

### Files to Modify:
- `lib/pdf.ts` (image sizing CSS)

---

## ISSUE 9: Wax Seal on All Pages
**Current State:** Wax seal appears on every page
**Expected State:** Only on last page (per `waxSealLastPageOnly` setting)
**Root Cause:** `waxSealLastPageOnly` flag not implemented in PDF generation

### Required Changes:
- Implement page detection logic
- Apply wax seal conditionally on last page only
- Use CSS page selectors or JavaScript

### Files to Modify:
- `lib/pdf.ts` (implement conditional wax seal)

---

## ISSUE 10: Incorrect Date (April 9, 2023)
**Current State:** Shows April 9, 2023 instead of current date
**Expected State:** Show current or holiday-appropriate date
**Root Cause:** Date is likely hardcoded in AI prompt or template

### Required Changes:
- Add `letterDate` configuration to Template model
- Allow "current" or specific date options
- Pass correct date to AI generation
- Special handling for birthdays (must be configurable)

### Files to Modify:
- `prisma/schema.prisma`
- `lib/ai.ts`
- `lib/prompt-template.ts`

---

## ISSUE 11: Missing Holiday Email Header
**Current State:** No holiday-specific email header image
**Expected State:** Festive header in delivery emails
**Root Cause:** No `emailHeaderKey` field in Template model

### Required Changes:
- Add `emailHeaderKey` to Template schema
- Add upload UI in template editor
- Update email template to include header image

### Files to Modify:
- `prisma/schema.prisma`
- `lib/email.ts`
- `app/admin/templates/[id]/page.tsx`

---

## ISSUE 12: No Personalization Beyond Name
**Current State:** Generated content only uses recipient name
**Expected State:** Rich personalization using all collected fields
**Root Cause:** Personalization data not passed to AI generation

### Required Changes:
- Pass all `recipientDetails` to AI prompt context
- Update Handlebars templates to use all fields
- Ensure AI prompts reference available personalization

### Files to Modify:
- `lib/ai.ts`
- `lib/prompt-template.ts`
- `lib/handlebars-utils.ts`

---

## Implementation Priority

### Phase 1 - Critical Data Issues (1-2 days)
1. **Issue #1** - Fix personalization fields collection
2. **Issue #12** - Pass personalization to AI
3. **Issue #10** - Fix date generation

### Phase 2 - Content Quality (1-2 days)
4. **Issue #2** - Improve AI prompt quality
5. **Issue #9** - Fix wax seal placement
6. **Issue #7** - Adjust font sizing
7. **Issue #8** - Fix image sizing

### Phase 3 - Missing Features (2-3 days)
8. **Issue #5** - Add sender address
9. **Issue #4** - Fix return addresses
10. **Issue #3** - Add envelope images
11. **Issue #11** - Add email headers

### Phase 4 - Polish (1 day)
12. **Issue #6** - Clarify margins

---

## Database Migration Requirements
The following schema changes are needed:
```prisma
model Order {
  // Add:
  senderAddress     Json?       // { name, line1, line2, city, state, zip }
}

model Template {
  // Add:
  returnAddress         String?   // Formatted return address
  envelopeBackgroundKey String?   // S3 key for envelope background
  emailHeaderKey        String?   // S3 key for email header
  fontSize              String    @default("16px")
  letterDateFormat      String    @default("current") // "current" | "christmas_2024" | "custom"
  letterDateCustom      String?   // If format is "custom"
}
```

---

## Risk Assessment
- **HIGH RISK**: Issues #1, #10, #12 directly impact customer satisfaction
- **MEDIUM RISK**: Issues #2, #4, #5 affect perceived quality
- **LOW RISK**: Issues #3, #6, #7, #8, #9, #11 are primarily aesthetic

---

## Testing Requirements
- Test claim form with various personalization field configurations
- Verify AI content generation with full personalization data
- Test PDF generation with all image combinations
- Verify date handling for different holidays
- Test email delivery with headers
- Multi-page PDF testing for wax seal placement

---

## Estimated Total Effort: 5-8 days for complete implementation