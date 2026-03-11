-- Critical Gap Fixes from GAP_REPORT.md (2026-03-11)

-- Issue #5: Recipient address collection
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientAddress" JSONB;

-- Issue #4: Configurable return address
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "returnAddress" TEXT;

-- Issue #3: Envelope background upload
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "envelopeBackgroundKey" TEXT;

-- Issue #11: Email header image
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "emailHeaderKey" TEXT;

-- Issue #7: Configurable font size (reduced from 16px)
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "fontSize" TEXT DEFAULT '14px';

-- Issue #10: Date configuration
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "letterDateFormat" TEXT DEFAULT 'current';
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "letterDateCustom" TEXT;