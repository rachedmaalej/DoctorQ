-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('normal', 'urgent');

-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN "priority" "Priority" NOT NULL DEFAULT 'normal';

-- Backfill: migrate isEmergency=true to priority=urgent
UPDATE "QueueEntry" SET "priority" = 'urgent' WHERE "isEmergency" = true;
