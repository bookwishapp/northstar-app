-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'etsy',
    "externalOrderId" TEXT,
    "holidaySlug" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "claimToken" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "customerEmail" TEXT,
    "customerName" TEXT,
    "emailConsent" BOOLEAN NOT NULL DEFAULT false,
    "recipientName" TEXT,
    "recipientAge" INTEGER,
    "recipientDetails" JSONB,
    "deliveryAddress" JSONB,
    "generatedLetter" TEXT,
    "generatedStory" TEXT,
    "letterPdfKey" TEXT,
    "storyPdfKey" TEXT,
    "envelopePdfKey" TEXT,
    "postgridLetterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_claim',
    "errorMessage" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "holidaySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "deliveryTypes" TEXT[],
    "priceDigital" DOUBLE PRECISION,
    "pricePhysical" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "holidaySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundKey" TEXT,
    "headerKey" TEXT,
    "characterKey" TEXT,
    "waxSealKey" TEXT,
    "signatureKey" TEXT,
    "fontFamily" TEXT NOT NULL DEFAULT 'Special Elite',
    "fontUrl" TEXT NOT NULL DEFAULT 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
    "primaryColor" TEXT NOT NULL DEFAULT '#2c1810',
    "accentColor" TEXT NOT NULL DEFAULT '#8b0000',
    "paperSize" TEXT NOT NULL DEFAULT 'letter',
    "marginTop" TEXT NOT NULL DEFAULT '1.2in',
    "marginBottom" TEXT NOT NULL DEFAULT '1in',
    "marginLeft" TEXT NOT NULL DEFAULT '0.9in',
    "marginRight" TEXT NOT NULL DEFAULT '0.9in',
    "repeatBackground" BOOLEAN NOT NULL DEFAULT true,
    "headerFirstPageOnly" BOOLEAN NOT NULL DEFAULT true,
    "waxSealLastPageOnly" BOOLEAN NOT NULL DEFAULT true,
    "character" TEXT NOT NULL,
    "characterTone" TEXT NOT NULL,
    "letterPrompt" TEXT NOT NULL,
    "storyPrompt" TEXT NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_claimToken_key" ON "Order"("claimToken");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;