-- AlterTable
ALTER TABLE "Template" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'North Pole';
ALTER TABLE "Template" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;