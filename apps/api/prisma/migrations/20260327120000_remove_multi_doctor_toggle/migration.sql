-- Step 1: For any clinic that has NO Doctor records,
-- create a default Doctor record from the clinic owner's info.
-- Uses doctorName (actual doctor), falling back to clinic name.
-- Matches state to current isDoctorPresent flag.
INSERT INTO "Doctor" (id, "clinicId", name, specialty, state, "avgConsultationMins", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  c.id,
  COALESCE(NULLIF(c."doctorName", ''), c.name),
  c.specialty,
  CASE WHEN c."isDoctorPresent" THEN 'free' ELSE 'inactive' END,
  c."avgConsultationMins",
  NOW(),
  NOW()
FROM "Clinic" c
LEFT JOIN "Doctor" d ON d."clinicId" = c.id
WHERE d.id IS NULL;

-- Step 2: For existing queue entries with NULL doctorId,
-- assign them to their clinic's first (oldest) active doctor.
UPDATE "QueueEntry" qe
SET "doctorId" = sub.doctor_id
FROM (
  SELECT DISTINCT ON (d."clinicId") d.id AS doctor_id, d."clinicId"
  FROM "Doctor" d
  WHERE d."isActive" = true
  ORDER BY d."clinicId", d."createdAt" ASC
) sub
WHERE qe."clinicId" = sub."clinicId"
  AND qe."doctorId" IS NULL
  AND qe.status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION');

-- Step 3: Drop the column
ALTER TABLE "Clinic" DROP COLUMN IF EXISTS "multiDoctorEnabled";
