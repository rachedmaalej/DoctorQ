-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'NOTIFIED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('QR_CODE', 'MANUAL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doctorName" TEXT,
    "doctorGender" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "avgConsultationMins" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "notifyAtPosition" INTEGER NOT NULL DEFAULT 2,
    "enableWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "isDoctorPresent" BOOLEAN NOT NULL DEFAULT false,
    "announcement" TEXT,
    "announcementAt" TIMESTAMP(3),
    "businessType" TEXT NOT NULL DEFAULT 'medical',
    "showAppointments" BOOLEAN NOT NULL DEFAULT true,
    "specialty" TEXT,
    "funFactsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT NOT NULL DEFAULT 'TN',
    "enableLanguageSwitcher" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscriptionPlan" "SubscriptionPlan",
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "smsCredits" INTEGER NOT NULL DEFAULT 0,
    "smsCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avgConsultationMins" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "doctorId" TEXT,
    "patientName" TEXT,
    "patientPhone" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "checkInMethod" "CheckInMethod" NOT NULL DEFAULT 'MANUAL',
    "appointmentTime" TIMESTAMP(3),
    "priorityOrder" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStat" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalPatients" INTEGER NOT NULL DEFAULT 0,
    "avgWaitMins" INTEGER,
    "avgConsultationMins" INTEGER,
    "noShows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "month" DATE NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amount" INTEGER,
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsPackagePurchase" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsPackagePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_email_key" ON "Clinic"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_emailVerificationToken_key" ON "Clinic"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_passwordResetToken_key" ON "Clinic"("passwordResetToken");

-- CreateIndex
CREATE INDEX "Clinic_email_idx" ON "Clinic"("email");

-- CreateIndex
CREATE INDEX "Clinic_subscriptionStatus_idx" ON "Clinic"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "Clinic_trialEndsAt_idx" ON "Clinic"("trialEndsAt");

-- CreateIndex
CREATE INDEX "Doctor_clinicId_isActive_idx" ON "Doctor"("clinicId", "isActive");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_status_idx" ON "QueueEntry"("clinicId", "status");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_arrivedAt_idx" ON "QueueEntry"("clinicId", "arrivedAt");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_createdAt_idx" ON "QueueEntry"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_appointmentTime_idx" ON "QueueEntry"("clinicId", "appointmentTime");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_status_position_idx" ON "QueueEntry"("clinicId", "status", "position");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_status_arrivedAt_idx" ON "QueueEntry"("clinicId", "status", "arrivedAt");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_patientPhone_status_idx" ON "QueueEntry"("clinicId", "patientPhone", "status");

-- CreateIndex
CREATE INDEX "QueueEntry_patientPhone_idx" ON "QueueEntry"("patientPhone");

-- CreateIndex
CREATE INDEX "QueueEntry_status_completedAt_idx" ON "QueueEntry"("status", "completedAt");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_calledAt_idx" ON "QueueEntry"("clinicId", "calledAt");

-- CreateIndex
CREATE INDEX "QueueEntry_doctorId_idx" ON "QueueEntry"("doctorId");

-- CreateIndex
CREATE INDEX "DailyStat_clinicId_date_idx" ON "DailyStat"("clinicId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_clinicId_date_key" ON "DailyStat"("clinicId", "date");

-- CreateIndex
CREATE INDEX "PaymentRecord_clinicId_idx" ON "PaymentRecord"("clinicId");

-- CreateIndex
CREATE INDEX "PaymentRecord_month_idx" ON "PaymentRecord"("month");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_clinicId_month_key" ON "PaymentRecord"("clinicId", "month");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_clinicId_idx" ON "SubscriptionEvent"("clinicId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_eventType_idx" ON "SubscriptionEvent"("eventType");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_createdAt_idx" ON "SubscriptionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SmsPackagePurchase_clinicId_idx" ON "SmsPackagePurchase"("clinicId");

-- CreateIndex
CREATE INDEX "SmsPackagePurchase_createdAt_idx" ON "SmsPackagePurchase"("createdAt");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStat" ADD CONSTRAINT "DailyStat_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsPackagePurchase" ADD CONSTRAINT "SmsPackagePurchase_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
