# North Star Postal - Implementation Plan
## March 11, 2026

## Overview
This plan addresses ALL 12 critical issues identified in the gap report. All issues will be implemented simultaneously as they are all critical for proper system operation.

---

## Database Migration Requirements

Create a single migration with all schema changes:

```prisma
model Order {
  // Add recipient address collection (Issue #5)
  recipientAddress  Json?       // { name, line1, line2, city, state, zip, country }
}

model Template {
  // Add missing configuration fields
  returnAddress         String?   // Issue #4: Configurable return address
  envelopeBackgroundKey String?   // Issue #3: S3 key for envelope background
  emailHeaderKey        String?   // Issue #11: S3 key for email header
  fontSize              String    @default("14px") // Issue #7: Configurable font size (reduced from 16px)
  letterDateFormat      String    @default("current") // Issue #10: Date configuration
  letterDateCustom      String?   // Issue #10: Custom date if needed
}
```

---

## Implementation Tasks

### 1. Database & Schema Updates
**Files:** `prisma/schema.prisma`
- Add all new fields listed above
- Run migration: `npx prisma migrate dev --name add-critical-fields`
- Deploy migration to production

### 2. Personalization System (Issues #1, #12)
**Files to modify:**
- `components/claim/ClaimForm.tsx` - Dynamic field rendering
- `app/api/claim/[token]/route.ts` - Store all personalization data
- `lib/ai.ts` - Pass full context to AI
- `lib/prompt-template.ts` - Use all personalization fields
- `lib/handlebars-utils.ts` - Register all helpers

**Implementation:**
- Render fields from `template.personalizationFields` dynamically
- Store in `order.recipientDetails` as JSON
- Pass complete context to AI generation
- Update Handlebars templates to use all fields

### 3. Prompt Content Updates (Issue #2)
**Note: This requires database updates only, no code changes**
- Update `letterPrompt` in templates via admin UI
- Update `storyPrompt` in templates via admin UI
- Add style examples and literary guidance
- Consider temperature settings in prompts

### 4. PDF Generation Fixes (Issues #7, #8, #9)
**Files:** `lib/pdf.ts`

**Changes:**
```css
/* Issue #7: Reduce font size */
body { font-size: 14px; } /* Down from 16px */

/* Issue #8: Increase image sizes */
.character-image {
  width: 200px; /* Up from current */
  height: auto;
}
.header-image {
  width: 100%;
  max-width: 400px;
}

/* Issue #9: Wax seal on last page only */
.wax-seal {
  display: none;
}
@page :last {
  .wax-seal {
    display: block;
  }
}
```

### 5. Address Collection (Issues #4, #5)
**Files to modify:**
- `components/claim/ClaimForm.tsx` - Add recipient address fields
- `app/api/claim/[token]/route.ts` - Store address data
- `lib/pdf.ts` - Use addresses in PDF generation
- `app/admin/templates/[id]/page.tsx` - Add return address field

**Implementation:**
- Add address form section to claim form
- Store as JSON in `order.recipientAddress`
- Use template's `returnAddress` in PDFs
- Make return address configurable per template

### 6. Upload Features (Issues #3, #11)
**Files to modify:**
- `app/admin/templates/[id]/page.tsx` - Add upload UI
- `lib/pdf.ts` - Use envelope background
- `lib/email.ts` - Use email header

**Implementation:**
- Add S3 upload for envelope backgrounds
- Add S3 upload for email headers
- Update PDF generation to use custom envelope
- Update email template to include header

### 7. Date Configuration (Issue #10)
**Files to modify:**
- `app/admin/templates/[id]/page.tsx` - Add date configuration UI
- `lib/ai.ts` - Pass configured date to AI
- `lib/prompt-template.ts` - Include date in context

**Implementation:**
- Add date format selector (current/custom/holiday-specific)
- Pass selected date to AI generation
- Special handling for birthdays (must be configurable)

### 8. Margin Documentation (Issue #6)
**Files:** `lib/pdf.ts`, documentation

**Implementation:**
- Add clear CSS comments explaining margin behavior
- Separate content margins from decorative margins
- Create visual guide for admin preview

---

## Implementation Order (Parallel Tracks)

### Track A: Database & Core Data Flow
**Developer 1:**
1. Create and run database migration
2. Update ClaimForm for personalization (Issue #1)
3. Update API routes to handle new data
4. Update AI integration (Issue #12)

### Track B: PDF Generation
**Developer 2:**
1. Fix font sizes (Issue #7)
2. Fix image sizes (Issue #8)
3. Implement conditional wax seal (Issue #9)
4. Clarify margins (Issue #6)

### Track C: Admin Features
**Developer 3:**
1. Add upload UI for envelopes (Issue #3)
2. Add upload UI for email headers (Issue #11)
3. Add return address configuration (Issue #4)
4. Add date configuration (Issue #10)

### Track D: User-Facing Features
**Developer 4:**
1. Add recipient address collection (Issue #5)
2. Update email templates with headers
3. Test claim flow end-to-end

---

## Testing Checklist

### Unit Tests
- [ ] Personalization field rendering
- [ ] Address validation
- [ ] Date formatting logic
- [ ] PDF CSS generation

### Integration Tests
- [ ] Complete claim flow with all fields
- [ ] PDF generation with all configurations
- [ ] Email delivery with headers
- [ ] Multi-page PDF wax seal placement

### Manual Testing
- [ ] Test each holiday template
- [ ] Test various personalization configurations
- [ ] Verify AI content uses all data
- [ ] Test different date settings
- [ ] Verify image sizing in PDFs
- [ ] Check font readability
- [ ] Confirm wax seal on last page only
- [ ] Test email headers display correctly

---

## Deployment Steps

1. **Pre-deployment:**
   - Review all code changes
   - Run full test suite locally
   - Build project: `npm run build`

2. **Database Migration:**
   - Deploy migration to staging first
   - Verify schema changes
   - Deploy to production

3. **Code Deployment:**
   - Deploy to staging environment
   - Run integration tests
   - Deploy to production

4. **Post-deployment:**
   - Update template prompts via admin UI (Issue #2)
   - Upload envelope backgrounds for templates
   - Upload email headers for templates
   - Configure return addresses
   - Test one order end-to-end

---

## Risk Mitigation

- **Backup:** Take full database backup before migration
- **Rollback Plan:** Keep previous deployment ready
- **Monitoring:** Watch error logs during first 24 hours
- **Testing:** Create test orders for each holiday after deployment

---

## Success Criteria

- [ ] All 12 issues resolved
- [ ] No regression in existing functionality
- [ ] Successful test order for each holiday
- [ ] AI content properly personalized
- [ ] PDFs render correctly with all features
- [ ] Emails delivered with proper formatting

---

## Notes

- Issue #2 (prompt quality) requires no code changes, only database updates
- All UI changes should maintain existing design patterns
- S3 uploads should validate file types and sizes
- Consider adding feature flags for gradual rollout

---

## Estimated Timeline

With parallel development:
- Day 1: Database migration, core infrastructure
- Day 2-3: Implement all features in parallel
- Day 4: Integration and testing
- Day 5: Deployment and verification

Total: **5 days with 4 developers working in parallel**

Or with single developer:
- Days 1-2: Database and core data flow
- Days 3-4: PDF and display fixes
- Days 5-6: Admin features and uploads
- Days 7-8: Testing and deployment

Total: **8 days with single developer**