-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_slug_key" ON "Holiday"("slug");

-- AlterTable
ALTER TABLE "Program" ADD COLUMN "holidayId" TEXT,
                     ADD COLUMN "description" TEXT,
                     ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Template" ADD COLUMN "holidayId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Template_holidayId_key" ON "Template"("holidayId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_holidayId_fkey" FOREIGN KEY ("holidayId") REFERENCES "Holiday"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_holidayId_fkey" FOREIGN KEY ("holidayId") REFERENCES "Holiday"("id") ON DELETE SET NULL ON UPDATE CASCADE;