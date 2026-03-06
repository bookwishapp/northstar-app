# North Star Postal — Architecture Document
> This document defines the complete backend rebuild. Claude Code must follow this spec precisely.  
> Do not create endpoints, tables, or services not defined here.  
> Do not suggest Inngest, Puppeteer, Supabase, or Vercel. They are not part of this system.

---

## Overview

North Star Postal is a personalized holiday letter service. Customers purchase letters on Etsy (and eventually directly on the site). An admin creates the order manually. The customer receives an email with a unique link to claim their order and provide personalization details. The system then generates a letter and story using AI, renders them as PDFs via Gotenberg, and delivers them via email (digital) or physical mail (PostGrid).

---

## Hosting: Railway

All services run on Railway in a single project:

| Service | Type | Notes |
|---|---|---|
| `northstar-app` | Next.js (Node server, NOT edge/serverless) | The main application |
| `northstar-db` | PostgreSQL | Railway-managed Postgres |
| `northstar-gotenberg` | Docker image `gotenberg/gotenberg:8` | PDF rendering service |

**Critical:** Next.js must be deployed as a standard Node.js server, not as edge functions or serverless. Set `output: 'standalone'` in `next.config.ts`. This is required for Gotenberg communication and background processing to work correctly.

Railway environment variables are shared across services via Railway's reference variables.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database ORM:** Prisma with Railway PostgreSQL
- **PDF Generation:** Gotenberg (Docker, internal Railway service)
- **Email:** AWS SES (via `@aws-sdk/client-ses`)
- **File Storage:** AWS S3 (via `@aws-sdk/client-s3`) — PDFs, template assets, graphics
- **AI Generation:** OpenAI GPT-4o (letters AND stories — single API key, no Anthropic for now)
- **Physical Fulfillment:** PostGrid API
- **Font:** Google Fonts — Special Elite (loaded in HTML templates, not via Next.js font system)
- **Future payments:** Stripe (stub the webhook endpoint now, wire it later)
- **Future email marketing:** Listmonk (self-hosted on Railway later, connects to same Postgres DB)

---

## Database Schema

Use Prisma. One migration. No patch SQL files.

```prisma
model Order {
  id                String      @id @default(cuid())
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Source
  source            String      @default("etsy") // "etsy" | "website"
  externalOrderId   String?     // Etsy order ID for reference

  // Program
  holidaySlug       String      // "christmas" | "easter" | "birthday" | etc.
  programId         String      // references Program.id
  deliveryType      String      // "digital" | "physical"

  // Claim
  claimToken        String      @unique @default(cuid())
  claimedAt         DateTime?

  // Customer (collected at claim)
  customerEmail     String?
  customerName      String?
  emailConsent      Boolean     @default(false)

  // Recipient personalization (collected at claim)
  recipientName     String?
  recipientAge      Int?
  recipientDetails  Json?       // flexible key/value for holiday-specific fields

  // Physical delivery (collected at claim if deliveryType = physical)
  deliveryAddress   Json?       // { line1, line2, city, state, zip, country }

  // Generation
  generatedLetter   String?     // raw AI text
  generatedStory    String?     // raw AI text

  // PDFs (S3 keys)
  letterPdfKey      String?
  storyPdfKey       String?
  envelopePdfKey    String?     // digital orders only

  // Fulfillment
  postgridLetterId  String?     // physical orders

  // Status machine (see Order Status below)
  status            String      @default("pending_claim")
  errorMessage      String?     // last error if status = failed

  program           Program     @relation(fields: [programId], references: [id])
}

model Program {
  id              String    @id @default(cuid())
  holidaySlug     String    // "christmas" | "easter" | "birthday" | etc.
  name            String    // "Santa Letter — Deluxe"
  tier            String    // "standard" | "deluxe"
  deliveryTypes   String[]  // ["digital", "physical"] or just ["digital"]
  priceDigital    Float?
  pricePhysical   Float?
  isActive        Boolean   @default(true)
  templateId      String
  template        Template  @relation(fields: [templateId], references: [id])
  orders          Order[]
}

model Template {
  id              String    @id @default(cuid())
  holidaySlug     String
  name            String

  // Visual config — all asset paths are S3 keys
  backgroundKey   String?   // S3 key for background image
  headerKey       String?   // S3 key for header graphic
  characterKey    String?   // S3 key for character graphic
  waxSealKey      String?   // S3 key for wax seal/stamp graphic
  signatureKey    String?   // S3 key for signature block graphic

  // Typography
  fontFamily      String    @default("Special Elite")
  fontUrl         String    @default("https://fonts.googleapis.com/css2?family=Special+Elite&display=swap")
  primaryColor    String    @default("#2c1810")
  accentColor     String    @default("#8b0000")

  // Layout
  paperSize       String    @default("letter") // "letter" | "a4"
  marginTop       String    @default("1.2in")
  marginBottom    String    @default("1in")
  marginLeft      String    @default("0.9in")
  marginRight     String    @default("0.9in")

  // Multi-page behavior
  repeatBackground      Boolean @default(true)
  headerFirstPageOnly   Boolean @default(true)
  waxSealLastPageOnly   Boolean @default(true)

  // AI prompt config
  character       String    // "Santa Claus" | "Easter Bunny" | etc.
  characterTone   String    // "warm, magical, believes in the child"
  letterPrompt    String    // Full system prompt for letter generation
  storyPrompt     String    // Full system prompt for story generation

  programs        Program[]
}

model AdminUser {
  id          String    @id @default(cuid())
  email       String    @unique
  passwordHash String
  createdAt   DateTime  @default(now())
}
```

---

## Order Status Machine

Orders move through statuses in sequence. No order ever goes backward. If a step fails, status becomes `failed` and `errorMessage` is set.

```
pending_claim
    ↓  (customer submits claim form)
pending_generation
    ↓  (OpenAI generates letter + story text)
pending_pdf
    ↓  (Gotenberg renders PDFs, S3 stores them)
pending_delivery
    ↓  (SES sends email OR PostGrid sends physical)
delivered
```

**failed** — can occur at any step. Admin can retry from the admin panel.

The worker (see Processing below) handles all transitions from `pending_generation` onward. It never manually nudges — it either fully succeeds to the next status or sets `failed` with a clear error message.

---

## API Routes

**Five routes only.** Do not create additional routes. Internal logic lives in service functions, not new endpoints.

```
POST   /api/orders                  Admin creates order from Etsy sale
GET    /api/claim/[token]           Returns order data for claim page (validates token)
POST   /api/claim/[token]           Customer submits personalization form
GET    /api/orders/[id]/status      Public order status for tracking page
POST   /api/webhooks/stripe         Future Stripe payments (return 200 for now, no logic)
```

### POST /api/orders
Protected by admin session. Body:
```typescript
{
  externalOrderId: string       // Etsy order ID
  holidaySlug: string
  programId: string
  deliveryType: "digital" | "physical"
  customerEmail: string         // to send claim email
}
```
Creates order with status `pending_claim`, sends claim email via SES.

### GET /api/claim/[token]
Returns: `{ order: { recipientName, holidaySlug, programId, deliveryType }, template: { character } }`  
Returns 404 if token invalid or order already claimed.

### POST /api/claim/[token]
Body:
```typescript
{
  customerName: string
  recipientName: string
  recipientAge: number
  recipientDetails: Record<string, string>  // holiday-specific fields
  deliveryEmail: string
  emailConsent: boolean
  deliveryAddress?: {           // required if deliveryType = physical
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
  }
}
```
Updates order with personalization, sets status to `pending_generation`, triggers processing.

### GET /api/orders/[id]/status
Returns: `{ status, deliveryType, createdAt }` — for the public tracking page.

---

## Processing Pipeline

Processing is triggered directly from `POST /api/claim/[token]` — no job queue, no Inngest, no cron.

```typescript
// lib/processor.ts
export async function processOrder(orderId: string) {
  try {
    // Step 1: Generate text
    await updateOrderStatus(orderId, 'pending_generation')
    const { letter, story } = await generateContent(orderId)
    await saveGeneratedContent(orderId, letter, story)

    // Step 2: Render PDFs
    await updateOrderStatus(orderId, 'pending_pdf')
    const pdfKeys = await renderPdfs(orderId)
    await savePdfKeys(orderId, pdfKeys)

    // Step 3: Deliver
    await updateOrderStatus(orderId, 'pending_delivery')
    await deliverOrder(orderId)

    await updateOrderStatus(orderId, 'delivered')
  } catch (error) {
    await updateOrderStatus(orderId, 'failed', error.message)
    throw error
  }
}
```

**Call it with `void processOrder(orderId)` in the API route** — don't await it, so the claim form submission returns immediately to the customer. Processing happens in the background within the same Node.js process. This works because Railway is a persistent server, not a serverless function.

For the admin retry button: call `processOrder(orderId)` from an admin-only API action.

---

## AI Content Generation

Single OpenAI client. No Anthropic for now.

```typescript
// lib/ai.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateContent(orderId: string) {
  const order = await getOrderWithTemplate(orderId)
  const { template, recipientName, recipientAge, recipientDetails } = order

  const recipientContext = buildRecipientContext(recipientName, recipientAge, recipientDetails)

  const [letterResponse, storyResponse] = await Promise.all([
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: template.letterPrompt },
        { role: 'user', content: recipientContext }
      ]
    }),
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: template.storyPrompt },
        { role: 'user', content: recipientContext }
      ]
    })
  ])

  return {
    letter: letterResponse.choices[0].message.content,
    story: storyResponse.choices[0].message.content
  }
}
```

---

## PDF Generation with Gotenberg

Gotenberg runs as a separate Railway service using the official Docker image `gotenberg/gotenberg:8`. It is only accessible internally within Railway — never exposed to the public internet.

Internal Railway URL: `http://northstar-gotenberg:3000` (set as `GOTENBERG_URL` env var)

```typescript
// lib/pdf.ts
export async function renderPdfs(orderId: string): Promise<PdfKeys> {
  const order = await getOrderWithTemplate(orderId)
  const { template } = order

  // Fetch S3 presigned URLs for assets
  const assets = await resolveTemplateAssets(template)

  // Render letter PDF
  const letterHtml = buildLetterHtml(order, assets)
  const letterPdf = await renderWithGotenberg(letterHtml, template)
  const letterKey = await uploadToS3(letterPdf, `orders/${orderId}/letter.pdf`)

  // Render story PDF
  const storyHtml = buildStoryHtml(order, assets)
  const storyPdf = await renderWithGotenberg(storyHtml, template)
  const storyKey = await uploadToS3(storyPdf, `orders/${orderId}/story.pdf`)

  // Digital orders: render envelope PDF
  let envelopeKey: string | null = null
  if (order.deliveryType === 'digital') {
    const envelopeHtml = buildEnvelopeHtml(order, assets)
    const envelopePdf = await renderWithGotenberg(envelopeHtml, template)
    envelopeKey = await uploadToS3(envelopePdf, `orders/${orderId}/envelope.pdf`)
  }

  return { letterKey, storyKey, envelopeKey }
}

async function renderWithGotenberg(html: string, template: Template): Promise<Buffer> {
  const formData = new FormData()
  formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html')
  formData.append('paperWidth', '8.5')
  formData.append('paperHeight', '11')
  formData.append('marginTop', template.marginTop)
  formData.append('marginBottom', template.marginBottom)
  formData.append('marginLeft', template.marginLeft)
  formData.append('marginRight', template.marginRight)
  formData.append('printBackground', 'true')

  const response = await fetch(
    `${process.env.GOTENBERG_URL}/forms/chromium/convert/html`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    throw new Error(`Gotenberg error: ${response.status} ${await response.text()}`)
  }

  return Buffer.from(await response.arrayBuffer())
}
```

---

## HTML Template Structure

Each letter template is a self-contained HTML file rendered by Gotenberg's headless Chromium. Special Elite is loaded from Google Fonts. All background/header/seal graphics are embedded as base64 data URIs (fetched from S3 before rendering) — this avoids any external URL issues inside Gotenberg.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: '{{fontFamily}}', serif;
      color: {{primaryColor}};
      background: transparent;
    }

    .page {
      width: 100%;
      min-height: 100vh;
      position: relative;
      padding: {{marginTop}} {{marginRight}} {{marginBottom}} {{marginLeft}};
    }

    .page-background {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-image: url('{{backgroundDataUri}}');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }

    .header {
      text-align: center;
      margin-bottom: 2em;
    }

    .header img {
      max-width: 80%;
      max-height: 120px;
    }

    .letter-body {
      font-size: 14pt;
      line-height: 1.8;
      white-space: pre-wrap;
    }

    .signature-block {
      margin-top: 2em;
      text-align: right;
    }

    .signature-block img {
      max-height: 80px;
    }

    .wax-seal {
      position: fixed;
      bottom: 0.5in;
      right: 0.7in;
    }

    .wax-seal img {
      width: 80px;
      height: 80px;
    }

    /* Multi-page: repeat background, header first page only */
    @media print {
      .page { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="page-background"></div>
  
  {{#if showHeader}}
  <div class="header">
    <img src="{{headerDataUri}}" alt="">
  </div>
  {{/if}}

  <div class="letter-body">{{letterText}}</div>

  <div class="signature-block">
    <img src="{{signatureDataUri}}" alt="{{character}}">
  </div>

  {{#if showWaxSeal}}
  <div class="wax-seal">
    <img src="{{waxSealDataUri}}" alt="">
  </div>
  {{/if}}
</body>
</html>
```

**Template rendering notes:**
- All `{{variable}}` values are injected by `buildLetterHtml()` before sending to Gotenberg
- All image assets are converted to base64 data URIs from S3 — never external URLs inside the template
- Multi-page letters: the background repeats via `position: fixed`, header only on first page, wax seal only on last page
- The envelope template is a #10 envelope (9.5" × 4.125") — set `paperWidth: 9.5` and `paperHeight: 4.125` in the Gotenberg call

---

## Email — AWS SES

```typescript
// lib/email.ts
import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses'

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

// 1. Claim email — sent when admin creates order
export async function sendClaimEmail(order: Order) {
  const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/claim/${order.claimToken}`
  // Send HTML email with claim link, character branding, holiday graphics
  // Use SES SendEmailCommand with HTML body
}

// 2. Delivery email — sent when PDFs are ready (digital orders)
export async function sendDeliveryEmail(order: Order, pdfS3Keys: PdfKeys) {
  // Generate presigned S3 URLs (24hr expiry) for letter, story, envelope PDFs
  // Send via SES SendRawEmailCommand with PDF attachments
  // Save customerEmail to database for future Listmonk integration
}
```

**Email list:** Every `customerEmail` collected at claim time (with `emailConsent: true`) is stored in the database. When Listmonk is added later, it will connect directly to the same Postgres database. No export/import needed.

---

## Physical Fulfillment — PostGrid

```typescript
// lib/postgrid.ts
export async function sendPhysicalLetter(order: Order) {
  // Fetch letter PDF from S3
  // POST to PostGrid API with:
  //   - PDF content (letter only, not story or envelope for physical)
  //   - delivery address from order.deliveryAddress
  //   - return address from env vars
  // Save postgridLetterId to order record
}
```

---

## File Storage — AWS S3

Bucket structure:
```
northstar-postal/
  templates/
    christmas/
      background.jpg
      header.png
      character.png
      wax-seal.png
      signature.png
    easter/
      ...
  orders/
    {orderId}/
      letter.pdf
      story.pdf
      envelope.pdf      (digital only)
  graphics/
    heroes/             (hero images for each holiday)
    products/           (product grid images)
    program-cards/      (regular + deluxe card graphics)
```

All S3 keys are stored in the database. Never store full URLs — always construct them from keys when needed. This allows bucket/CDN changes without database updates.

---

## Environment Variables

```bash
# Database
DATABASE_URL=                   # Railway Postgres connection string

# Railway internal
GOTENBERG_URL=http://northstar-gotenberg:3000

# AWS
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=northstar-postal

# OpenAI
OPENAI_API_KEY=

# PostGrid
POSTGRID_API_KEY=

# App
NEXT_PUBLIC_BASE_URL=https://northstarpostal.com
ADMIN_SESSION_SECRET=           # random 32+ char string

# Future
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Admin Panel

Simple password-protected admin area at `/admin`. Use iron-session or NextAuth with credentials provider — no OAuth needed.

Admin can:
- Create a new order (Etsy sale → form → sends claim email)
- View all orders with status
- Retry a failed order
- View order details (personalization, generated content, PDF links)

Admin panel is a simple Next.js page with server actions. No separate admin API endpoints beyond `POST /api/orders`.

---

## Claim Flow (Customer-Facing)

Route: `/claim/[token]`

Page fetches order data via `GET /api/claim/[token]`. Displays a form customized to the holiday (e.g., Christmas asks about accomplishments, Easter asks about favorite activities). On submit, calls `POST /api/claim/[token]`, then shows a confirmation page: "Your magical letter is being created! Check your email soon."

Holiday-specific form fields are defined in a client-side config:
```typescript
// lib/claim-fields.ts
export const claimFields: Record<string, Field[]> = {
  christmas: [
    { key: 'accomplishment', label: "What's their biggest accomplishment this year?", type: 'text' },
    { key: 'interest', label: "What are they most into right now?", type: 'text' },
    { key: 'sibling', label: "Any siblings or pets to mention?", type: 'text' },
  ],
  easter: [
    { key: 'favoriteActivity', label: "What's their favorite spring activity?", type: 'text' },
    { key: 'petName', label: "Do they have a pet? What's its name?", type: 'text' },
  ],
  birthday: [
    { key: 'age', label: "How old are they turning?", type: 'number' },
    { key: 'interest', label: "What are they really into right now?", type: 'text' },
    { key: 'wish', label: "What's their birthday wish?", type: 'text' },
  ],
  // ... other holidays
}
```

---

## What to Keep from the Existing Frontend

The following existing files/folders should be carried over unchanged:
- `app/` — all page UI files (not API routes)
- `components/` — all components
- `public/` — all static assets
- `envelope-templates/` — review and migrate to S3/template system
- `tailwind.config` / `postcss.config` / `tsconfig.json`

**Do not carry over:**
- `app/api/` — rebuild from scratch per this document
- `inngest/` — delete entirely
- `prisma/schema.prisma` — replace with schema above
- `migrations/` — start fresh
- All root-level SQL patch files (`*.sql`)
- All root-level debug/fix scripts (`debug-order.ts`, `force-regenerate-pdf.ts`, `fix-env.js`)
- All root-level markdown fix docs (`URGENT_PRODUCTION_FIX.md`, `PDF_GENERATION_ISSUE.md`, etc.)
- `vercel.json` — deploying to Railway

---

## Build Order for Claude Code

Implement in this order. Complete each step before moving to the next.

1. **Railway setup** — create project, add Postgres service, add Gotenberg service, configure env vars
2. **Prisma schema** — implement schema above, run initial migration
3. **Gotenberg connection** — verify `renderWithGotenberg()` works with a simple test HTML
4. **Template system** — `Template` model seeded with Christmas config, S3 asset helper functions
5. **AI generation** — `generateContent()` with Christmas letter + story prompts
6. **PDF pipeline** — `renderPdfs()` end to end, verify PDFs land in S3
7. **SES emails** — claim email and delivery email
8. **API routes** — implement all 5 routes
9. **Order processor** — `processOrder()` state machine wired end to end
10. **Admin panel** — create order form, order list, retry button
11. **Claim pages** — `/claim/[token]` with holiday-specific fields
12. **Tracking page** — wire existing `/track` to `GET /api/orders/[id]/status`
13. **PostGrid integration** — physical letter fulfillment
14. **Seed remaining holidays** — Easter, Birthday, Valentine, Halloween, St. Patrick's Day templates
15. **Stripe webhook stub** — `POST /api/webhooks/stripe` returns 200

---

## Rules for Claude Code

- **Never create API endpoints not listed in this document.** If a feature needs internal logic, write a function in `lib/`, not a new route.
- **Never use Inngest, Puppeteer, or any job queue library.** Processing is handled by `processOrder()` called directly.
- **Never patch the database with raw SQL files.** All schema changes go through Prisma migrations.
- **Always handle errors in the processor by setting `status: failed` and `errorMessage`.** Never swallow errors silently.
- **Test production behavior, not local behavior.** If something works locally but not on Railway, the local behavior is irrelevant.
- **S3 keys, not URLs.** Store S3 keys in the database. Construct URLs/presigned URLs at read time.
- **One migration.** Start clean. Do not add patch migrations.
