-- Add content approval fields
ALTER TABLE "Order" ADD COLUMN "regenerationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "contentApprovedAt" TIMESTAMP(3);