-- Add critical fields from GAP_REPORT.md

-- Issue #5: Recipient address collection
ALTER TABLE "Order" ADD COLUMN "recipientAddress" JSONB;

-- Issue #4: Configurable return address
ALTER TABLE "Template" ADD COLUMN "returnAddress" TEXT;

-- Issue #3: Envelope background upload
ALTER TABLE "Template" ADD COLUMN "envelopeBackgroundKey" TEXT;

-- Issue #11: Email header image
ALTER TABLE "Template" ADD COLUMN "emailHeaderKey" TEXT;

-- Issue #7: Configurable font size (reduced from 16px)
ALTER TABLE "Template" ADD COLUMN "fontSize" TEXT DEFAULT '14px' NOT NULL;

-- Issue #10: Date configuration
ALTER TABLE "Template" ADD COLUMN "letterDateFormat" TEXT DEFAULT 'current' NOT NULL;
ALTER TABLE "Template" ADD COLUMN "letterDateCustom" TEXT;