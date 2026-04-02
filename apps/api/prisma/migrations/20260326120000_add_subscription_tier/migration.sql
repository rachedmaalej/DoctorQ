-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'SOLO_PRO', 'EQUIPE', 'CLINIQUE');

-- AlterTable: Add tier and daily usage tracking to Clinic
ALTER TABLE "Clinic" ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Clinic" ADD COLUMN "dailyPatientCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Clinic" ADD COLUMN "dailyCountResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: Set existing ACTIVE/TRIAL clinics to SOLO_PRO (they were paying customers)
UPDATE "Clinic" SET "subscriptionTier" = 'SOLO_PRO' WHERE "subscriptionStatus" IN ('ACTIVE', 'TRIAL');
