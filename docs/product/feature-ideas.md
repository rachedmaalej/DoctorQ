# Feature Ideas

A collection of feature ideas to consider for future development.

---

## Patient Self-Service

### 1. Leave Queue Button
**Priority:** TBD
**Status:** Idea

Add a button to the patient status page that allows patients to voluntarily leave the queue.

**Details:**
- Button should be prominently visible on the patient status page
- Should require confirmation before removing from queue
- Update queue positions for remaining patients in real-time
- Optionally notify the clinic when a patient leaves
- Consider adding a reason selection (e.g., "Can't wait anymore", "Emergency", "Will come back later")

**Technical considerations:**
- New API endpoint: `DELETE /api/queue/patient/:entryId/leave` or `POST /api/queue/patient/:entryId/cancel`
- No authentication required (patient pages are public with entry ID)
- Emit socket event to update dashboard and other patients' positions
- Set status to `CANCELLED` in database

---

## Future Ideas

### 2. Doctor Arrival Time Display
**Priority:** TBD
**Status:** Idea

When the doctor is absent, allow them to input an estimated arrival time. This information is then displayed on the patient status page so patients know when to expect the doctor.

**Details:**
- Add an optional time input field on the dashboard when toggling "Doctor absent"
- Display the arrival time on the patient status page when doctor is absent
- Show a message like "Le docteur est absent. Arrivée prévue à 10:30" / "الطبيب غائب. الوصول المتوقع في 10:30"
- Clear the arrival time automatically when doctor marks themselves as present
- Consider allowing updates to the arrival time if the doctor is delayed

**Technical considerations:**
- Add `expectedArrivalTime` field to Clinic model (nullable DateTime)
- New API endpoint: `PATCH /api/clinic/arrival-time` to set/clear arrival time
- Update `setDoctorPresence` to optionally accept arrival time when marking absent
- Emit socket event when arrival time changes so patient pages update in real-time
- PatientStatusPage displays arrival time when `isDoctorPresent === false` and `expectedArrivalTime` is set

**UI Mockup:**
```
Dashboard (when toggling doctor absent):
┌─────────────────────────────────────────┐
│ ○ Docteur absent                        │
│   Heure d'arrivée prévue: [10:30] (opt) │
└─────────────────────────────────────────┘

Patient Status Page (when doctor absent):
┌─────────────────────────────────────────┐
│ ⏸️ Le docteur n'est pas encore arrivé   │
│    Arrivée prévue à 10:30               │
│    La file d'attente reprendra bientôt  │
└─────────────────────────────────────────┘
```

---
