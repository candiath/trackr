-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('MILD', 'MODERATE', 'INTENSE');

-- CreateEnum
CREATE TYPE "MoodLevel" AS ENUM ('VERY_GOOD', 'GOOD', 'OKAY', 'BAD', 'VERY_BAD');

-- CreateTable
CREATE TABLE "Relapse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relapse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelapseEvent" (
    "id" TEXT NOT NULL,
    "relapseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "triggerId" TEXT,
    "intensity" "Intensity",
    "moodLevel" "MoodLevel",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelapseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trigger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "level" "MoodLevel" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodFactor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MoodEntryFactors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MoodEntryFactors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "RelapseEvent_relapseId_idx" ON "RelapseEvent"("relapseId");

-- CreateIndex
CREATE UNIQUE INDEX "Trigger_name_key" ON "Trigger"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MoodFactor_name_key" ON "MoodFactor"("name");

-- CreateIndex
CREATE INDEX "_MoodEntryFactors_B_index" ON "_MoodEntryFactors"("B");

-- AddForeignKey
ALTER TABLE "RelapseEvent" ADD CONSTRAINT "RelapseEvent_relapseId_fkey" FOREIGN KEY ("relapseId") REFERENCES "Relapse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelapseEvent" ADD CONSTRAINT "RelapseEvent_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MoodEntryFactors" ADD CONSTRAINT "_MoodEntryFactors_A_fkey" FOREIGN KEY ("A") REFERENCES "MoodEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MoodEntryFactors" ADD CONSTRAINT "_MoodEntryFactors_B_fkey" FOREIGN KEY ("B") REFERENCES "MoodFactor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
