-- Trigger: Automatically seed a demo patient when a new clinic is created.
-- This gives new users something to see on their dashboard immediately.
-- The demo patient has a distinctive name and phone so it can be identified/cleaned up.

CREATE OR REPLACE FUNCTION seed_demo_patient()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "QueueEntry" (
    id,
    "clinicId",
    "patientName",
    "patientPhone",
    position,
    status,
    "checkInMethod",
    priority,
    "isSteppedOut",
    "stepOutCount",
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    'Patient Test',
    '+21600000000',
    1,
    'WAITING',
    'MANUAL',
    'normal',
    false,
    0,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS on_clinic_created ON "Clinic";

CREATE TRIGGER on_clinic_created
  AFTER INSERT ON "Clinic"
  FOR EACH ROW
  EXECUTE FUNCTION seed_demo_patient();
