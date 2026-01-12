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

*(Add new feature ideas below)*
