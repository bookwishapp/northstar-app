# North Star Postal - Backend Overview

## System Purpose

North Star Postal is a personalized letter and story generation service that creates magical holiday letters for children. The system allows:
- Etsy sellers to fulfill personalized letter orders
- Customers to claim and personalize their letters
- AI-powered generation of unique content for each child
- PDF generation and delivery (digital or physical mail)

## Technology Stack

### Core Framework
- **Next.js 16.1.6** (App Router) - Full-stack React framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database management and migrations
- **PostgreSQL** - Primary database (via Railway)

### AI & Content Generation
- **Anthropic Claude API** - AI content generation (claude-sonnet-4-6 model)
- Custom prompt templating system with variable substitution

### PDF Generation
- **Gotenberg** - HTML to PDF conversion service
- Custom HTML templates with Google Fonts integration
- Support for headers, backgrounds, signatures, and wax seals

### File Storage
- **AWS S3** - Asset storage for templates and generated PDFs
- Presigned URLs for secure file access

### Email Service
- **AWS SES** - Transactional email delivery
- HTML email templates with inline styling

### Authentication
- **NextAuth.js** - Admin authentication (credentials-based)
- Session management for admin panel

### Payment Processing
- **Stripe** - Payment collection (webhook ready)

### Physical Mail
- **PostGrid** - Physical letter printing and mailing (webhook ready)

## Architecture Overview

```
┌─────────────────────┐
│   Admin Interface   │
│  (/admin/*)         │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Next.js API       │
│  (/api/*)           │
├─────────────────────┤
│  - Order Management │
│  - AI Generation    │
│  - PDF Creation     │
│  - Email Delivery   │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  PostgreSQL │
    │   (Prisma)  │
    └─────────────┘
           │
    External Services
    ├── Anthropic (AI)
    ├── AWS S3 (Storage)
    ├── AWS SES (Email)
    ├── Gotenberg (PDF)
    ├── Stripe (Payment)
    └── PostGrid (Mail)
```

## Database Schema

### Core Models

#### Holiday
- Represents holidays (Christmas, Easter, etc.)
- Has multiple programs and one template
- Fields: `slug`, `name`, `description`, `isActive`

#### Template
- Defines the visual and content structure for a holiday
- Contains prompts, fonts, colors, and asset references
- Fields: character info, prompts, styling, S3 asset keys

#### Program
- Product offerings within a holiday (tiers: basic, premium, deluxe)
- Defines pricing and delivery options
- Fields: `tier`, `deliveryTypes`, `productTypes`, `prices`

#### Order
- Customer orders from Etsy
- Tracks status from creation through delivery
- Fields: customer info, recipient details, generated content, status

### Order Lifecycle States
1. `pending_claim` - Initial state, awaiting personalization
2. `claimed` - Customer provided recipient details
3. `processing` - AI content generation in progress
4. `completed` - Digital delivery sent
5. `failed` - Error occurred

## Key API Endpoints

### Admin Endpoints (`/api/admin/*`)
- **POST /api/orders** - Create order from Etsy sale
- **GET/PUT /api/admin/templates** - Manage templates
- **POST /api/admin/templates/[id]/upload** - Upload template assets
- **GET/PUT /api/admin/programs** - Manage programs
- **POST /api/admin/orders/[id]/resend-email** - Resend emails

### Customer Endpoints
- **GET /api/claim/[token]** - Retrieve order for claiming
- **POST /api/claim/[token]** - Submit personalization details
- **GET /api/orders/[id]/status** - Check order status

### Webhook Endpoints
- **POST /api/webhooks/stripe** - Process Stripe events
- **POST /api/webhooks/postgrid** - Handle mail delivery updates

## Core Workflows

### 1. Order Creation Flow
```
Admin creates order → Generate claim token → Send claim email →
Customer personalizes → AI generates content → Create PDFs →
Deliver (email or mail)
```

### 2. Content Generation Pipeline
```
Get template prompts → Build context (recipient details) →
Process variables → Call Claude API → Save generated content
```

### 3. PDF Generation Process
```
Load template assets from S3 → Convert to base64 →
Build HTML with content → Send to Gotenberg →
Upload PDF to S3 → Generate presigned URLs
```

### 4. Email Delivery
```
Build HTML email → Include presigned PDF links (24hr expiry) →
Send via AWS SES → Track delivery status
```

## File Structure

```
/
├── app/
│   ├── admin/           # Admin panel pages
│   ├── api/              # API routes
│   ├── claim/            # Customer claim pages
│   └── (public pages)
├── components/
│   ├── admin/            # Admin UI components
│   └── claim/            # Claim flow components
├── lib/
│   ├── prisma.ts         # Database client
│   ├── ai.ts             # AI generation logic
│   ├── pdf.ts            # PDF creation
│   ├── email.ts          # Email sending
│   ├── s3.ts             # S3 operations
│   ├── gotenberg.ts      # PDF service
│   └── prompt-template.ts # Template processing
└── prisma/
    └── schema.prisma     # Database schema
```

## Environment Variables

### Required for Production
```bash
# Database
DATABASE_URL              # PostgreSQL connection string

# AI Generation
ANTHROPIC_API_KEY        # Claude API key
ANTHROPIC_MODEL          # Model ID (default: claude-sonnet-4-6)

# AWS Services
AWS_ACCESS_KEY_ID        # AWS credentials
AWS_SECRET_ACCESS_KEY
AWS_REGION               # AWS region
S3_BUCKET_NAME          # S3 bucket for assets

# Email
FROM_EMAIL              # Sender email (verified in SES)
FROM_NAME               # Sender name

# Services
NEXT_PUBLIC_BASE_URL    # Application URL
GOTENBERG_URL           # PDF service URL
NEXTAUTH_URL            # Auth callback URL
NEXTAUTH_SECRET         # Session encryption

# Payment (Optional)
STRIPE_SECRET_KEY       # Stripe API key
STRIPE_WEBHOOK_SECRET   # Webhook verification

# Mail (Optional)
POSTGRID_API_KEY        # PostGrid API key
```

## Security Considerations

1. **Authentication**
   - Admin panel protected by NextAuth.js
   - Credentials-based login (expandable to OAuth)

2. **Order Security**
   - Unique claim tokens (UUID v4)
   - Orders can only be claimed once
   - No customer PII exposed in URLs

3. **File Access**
   - S3 presigned URLs with expiration
   - Assets stored with UUID-based keys
   - No direct public access to buckets

4. **API Security**
   - Admin endpoints require authentication
   - Webhook signature verification
   - Input validation with Zod schemas

## Key Features

### Flexible Product Configuration
- Programs can offer letter-only, story-only, or both
- Support for digital and physical delivery
- Tiered pricing (basic, premium, deluxe)

### Template System
- Rich customization options (fonts, colors, layouts)
- Variable substitution in prompts
- Support for multiple asset types

### Email-Optional Orders
- Etsy orders can be created without email
- Customers provide email during claim process
- Manual claim link delivery via Etsy messages

### Regeneration Support
- Customers can regenerate content up to 3 times
- Edit recipient details before regeneration
- Track regeneration count per order

## Production Deployment

Currently deployed on Railway with:
- Automatic deployments from GitHub main branch
- PostgreSQL database
- Environment variable management
- Custom domain support

## Monitoring & Logs

- Extensive console logging for debugging
- API response tracking
- Error handling with detailed messages
- AWS service status logging

## Future Considerations

### Planned Enhancements
- Customer portal for order tracking
- Bulk order processing
- Template preview system
- Analytics dashboard
- Marketing email integration (Listmonk ready)

### Scalability
- Database indexes on frequently queried fields
- S3 for unlimited file storage
- Stateless API design for horizontal scaling
- Queue system for async processing (if needed)

## Development Workflow

1. **Local Development**
   ```bash
   npm run dev         # Start dev server
   npx prisma studio   # Database GUI
   ```

2. **Database Changes**
   ```bash
   npx prisma migrate dev   # Local migrations
   npx prisma generate      # Update client
   ```

3. **Production Migrations**
   - Use migration endpoints for Railway
   - Cannot run migrations directly in production

## Testing Considerations

- Test claim flow with different recipient details
- Verify PDF generation with various content lengths
- Test email delivery to multiple providers
- Validate regeneration limits
- Check responsive design for claim pages

---

*This backend system provides a complete solution for personalized letter generation and delivery, with flexibility for both digital and physical fulfillment channels.*