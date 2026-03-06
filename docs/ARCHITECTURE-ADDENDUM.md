# ARCHITECTURE ADDENDUM — Template & Holiday Management
> Add this to ARCHITECTURE.md. CC must read this before building the admin panel (Step 10).
> This addendum takes priority over any conflicting guidance in the main document.

---

## What Was Missing — Now Required

The main architecture doc covers order processing, PDF generation, and the claim flow. It did NOT specify how templates, graphics, and AI prompts are managed. This addendum fills that gap.

North Star Postal is a **multi-holiday service**. Each holiday has its own:
- Visual identity (background, header, character, wax seal, signature graphics)
- Color scheme and layout config
- AI character and tone
- Letter generation prompt
- Story generation prompt

All of this must be **fully configurable by the admin** without touching code.

---

## Admin Panel Additions

Add the following sections to the admin panel at `/admin`:

### Nav structure
```
/admin                          → Dashboard (order stats)
/admin/orders                   → Order list (existing)
/admin/orders/new               → Create order (existing)
/admin/holidays                 → Holiday list
/admin/holidays/new             → Add new holiday
/admin/holidays/[slug]          → Edit holiday + its template
/admin/holidays/[slug]/programs → Manage programs for this holiday
```

---

## Holiday Management — `/admin/holidays`

Lists all holidays in the system with:
- Holiday name and slug
- Active/inactive toggle
- Number of programs
- Links to edit template, edit programs

### Adding a New Holiday — `/admin/holidays/new`

Form fields:
```
Holiday Name          (e.g. "Mother's Day")
Slug                  (e.g. "mothers_day" — auto-generated from name, editable)
Display Order         (integer, controls order on homepage)
Order Deadline Label  (e.g. "Order by May 7")
Active                (toggle — inactive holidays don't show on public site)
```

Creating a new holiday automatically creates a blank Template record linked to it, ready to configure.

---

## Template Management — `/admin/holidays/[slug]`

This is the main template editor. Two tabs: **Graphics & Layout** and **AI Prompts**.

---

### Tab 1: Graphics & Layout

#### Graphic uploads
For each graphic slot, show:
- Current image preview (fetched from S3, shown as `<img>` tag)
- Upload button → uploads directly to S3 at the correct key path
- Clear button → removes the graphic (sets key to null)

Graphic slots:
| Field | S3 Key Pattern | Notes |
|---|---|---|
| Background | `templates/{slug}/background.jpg` | Full page background |
| Header | `templates/{slug}/header.png` | Top of letter, first page only |
| Character | `templates/{slug}/character.png` | Used on site pages and claim flow |
| Wax Seal | `templates/{slug}/wax-seal.png` | Bottom of last page |
| Signature Block | `templates/{slug}/signature.png` | Above sign-off |

Upload flow:
1. Admin selects file in browser
2. Admin panel calls `POST /api/admin/templates/[id]/upload` with file + slot name
3. API uploads to S3 at the correct key, updates the Template record with the new key
4. Page refreshes the preview

#### Layout config fields
```
Primary Color         color picker + hex input   (e.g. #2d5a1b)
Accent Color          color picker + hex input   (e.g. #7b3f9e)
Paper Size            select: Letter | A4
Margin Top            text input                 (e.g. 1.2in)
Margin Bottom         text input
Margin Left           text input
Margin Right          text input
Repeat Background     toggle
Header First Page Only toggle
Wax Seal Last Page Only toggle
```

---

### Tab 2: AI Prompts

#### Character config
```
Character Name        text input    (e.g. "the Easter Bunny")
Character Tone        textarea      (e.g. "cheerful, playful, warm, slightly mischievous...")
```

#### Letter Prompt
Large textarea, full-width, ~20 rows. This is the GPT-4o system prompt for letter generation.
- Show a character count
- Include a "Test Prompt" button (see Testing below)

#### Story Prompt
Large textarea, full-width, ~20 rows. GPT-4o system prompt for story generation.
- Show a character count
- Include a "Test Prompt" button

#### Test Prompt button
Opens a modal with a simple test form:
```
Recipient Name    text input
Recipient Age     number input
Details           textarea (paste sample personalization details)
```
Clicking "Generate" calls OpenAI with the current (unsaved) prompt and the test data, and displays the result in the modal. This lets the admin preview and tweak prompts without creating a real order.

**Test prompt API route** (add to the 5 existing routes as an admin-only internal tool):
```
POST /api/admin/templates/[id]/test-prompt
Body: { promptType: "letter" | "story", recipientName, recipientAge, details }
Returns: { result: string }
```

---

## Program Management — `/admin/holidays/[slug]/programs`

Lists programs for the holiday. Each program shows:
- Name, tier (standard/deluxe), delivery types, prices, active status

### Add / Edit Program form:
```
Program Name          text input    (e.g. "Easter Bunny Letter — Deluxe")
Tier                  select: standard | deluxe
Delivery Types        checkboxes: digital, physical
Price (Digital)       number input  (leave blank if not offered)
Price (Physical)      number input  (leave blank if not offered)
Active                toggle
```

Programs can be deactivated but not deleted (to preserve order history).

---

## New API Route — Template Asset Upload

Add this one additional API route for graphic uploads:

```
POST /api/admin/templates/[id]/upload
```

Protected by admin session. Accepts `multipart/form-data`:
```
file      image file (jpg, png, webp)
slot      "background" | "header" | "character" | "waxSeal" | "signature"
```

Handler:
1. Validate file type and size (max 5MB)
2. Derive S3 key from template's `holidaySlug` and `slot`
3. Upload to S3 with `ContentType` set correctly
4. Update the Template record's corresponding key field
5. Return `{ key, previewUrl }` where `previewUrl` is a short-lived presigned URL

---

## Updated Admin Panel Summary

The complete admin panel now covers:

| Section | What it does |
|---|---|
| Dashboard | Order stats, recent orders |
| Orders | List, create (Etsy), view detail, retry failed |
| Holidays | List all holidays, add new, toggle active |
| Template Editor | Upload graphics per holiday, configure layout, edit AI prompts, test prompts |
| Programs | Add/edit programs per holiday (tiers, prices, delivery types) |

---

## Notes for Claude Code

- The `Template` and `Program` models in the Prisma schema already support all of this — no schema changes needed
- S3 uploads from the admin panel should go through the Next.js API route, not directly from the browser (keeps AWS credentials server-side)
- The test prompt feature is admin-only and does NOT create any database records
- When a new holiday is created, seed it with a blank template (null graphic keys, default colors/margins, placeholder prompt text that says "CONFIGURE THIS PROMPT BEFORE GOING LIVE")
- Inactive holidays should be hidden from the public homepage and all public routes, but remain accessible in the admin
