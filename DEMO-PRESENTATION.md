# DoctorQ v0.5.0 - Demo Presentation for Dr. Skander Kamoun

## Demo Overview
A compelling 10-15 minute demonstration showing DoctorQ's value proposition: eliminating patient waiting room anxiety and optimizing clinic flow.

**Version:** 0.5.0 (Beta/Pilot Release)
**Demo Date:** January 20, 2026

---

## Recommended Demo Timeline

### **Phase 1: The Problem (1-2 min)**
*Set the scene before showing the solution*

**Talk through the pain points:**
- "Your patients get an appointment for a day, not a time"
- "They arrive, sit in the waiting room for 1-3 hours with no visibility"
- "They're frustrated, anxious, and can't plan their day"
- "You end up seeing frustrated patients"

---

### **Phase 2: The Doctor's View - Dashboard (4-5 min)**

**Step 1: Login**
- URL: `https://doctor-q-web.vercel.app`
- Credentials: `dr.skander@example.tn` / `password123`
- Show the clean, professional login screen

**Step 2: Empty Dashboard Tour**
- Point out the QR code card: "This is your unique clinic QR code"
- Show the stats bar: 3 cards showing "En Attente" (waiting), "Vus Aujourd'hui" (seen today), and "Attente moyenne" (grayed out - coming soon)
- Explain the "Call Next" button prominence

**Step 3: Populate the Queue**
- Click **"Fill Queue (Demo)"** button
- Watch 6 test patients appear with realistic Tunisian names
- Point out the different statuses visible

**Step 4: Queue Management Features**
- **Reorder**: Use up/down arrows to change patient order
- **Emergency**: Click the red emergency button - patient jumps to position 1
- **Remove**: Show how to remove a no-show patient
- **Add Patient**: Click "Add Patient" - show the manual entry form (receptionist use case)

**Step 5: Doctor Presence Toggle**
- Toggle "Doctor Present" ON (green)
- Explain: "When you're away for lunch or prayer, toggle off - patients are notified"

**Step 6: Call Next Patient**
- Click the big **"Call Next"** button
- Show patient moves to "In Consultation" status
- Point out: "Patient #2 gets automatic SMS notification that they're almost up"

---

### **Phase 3: The Patient Experience (4-5 min)**
*This is the "wow" moment - show this on a phone or second browser tab*

**Step 1: QR Code Check-in**
- On the dashboard, click the QR code or copy the check-in link
- Open in new incognito/private window or phone
- Show the clean check-in page with Tunisian phone prefix

**Step 2: Patient Check-in Flow**
- Enter a phone number: `+216 98 123 456`
- Optionally enter name
- Submit - show the smooth transition

**Step 3: Patient Status Page - The Journey**
- Show the visual "journey" - patient icon, chairs (people ahead), door
- Point out the ticket-style position card
- Explain estimated wait time calculation

**Step 4: Real-time Updates**
- Go back to the doctor dashboard tab
- Click **"Call Next"** again
- **Switch to patient tab** - watch position update in real-time
- Show the toast notification: "You moved up! Now position X"

**Step 5: The "Your Turn" Moment**
- Keep calling next until the demo patient is called
- **Watch the confetti animation** 🎉
- Show the green "It's Your Turn!" screen
- "Doctor is waiting for you" message

**Step 6: Doctor Absence Notification**
- Toggle "Doctor Present" OFF on dashboard
- Show patient page - warning banner appears
- "Patients know you're not available, reducing frustration"

---

### **Phase 4: Mobile Experience (1-2 min)**
*Both devices are already showing mobile views - this is the real experience!*

**On iPad Mini (Doctor Dashboard):**
- Point out the clean tablet layout
- Stats cards visible at a glance
- "Call Next" button easy to tap
- Can manage the entire queue from the tablet

**On Phone (Patient View):**
- "This is exactly what your patients see"
- Clean, simple, no clutter
- "They can watch their position update while at the café"

---

### **Phase 5: Key Benefits Summary (1 min)**

**For the Doctor:**
- See your queue at a glance
- Call patients with one click
- Manage emergencies and no-shows easily
- Works on desktop and mobile

**For Patients:**
- Check in via QR code - no app install needed
- Real-time position tracking
- SMS notifications when their turn approaches
- Can wait elsewhere - home, café, car
- Arrive just in time, less waiting room stress

**For the Clinic:**
- Happier patients = better reviews
- More efficient flow
- Fewer no-shows (patients can cancel remotely)
- Professional, modern image

---

### **Phase 6: Pricing & Next Steps (30 sec)**
- "50 TND/month (~$16 USD)"
- "We can set up your clinic in 10 minutes"
- "All you need is this QR code printed at reception"

---

## Demo Checklist

### Before the Demo:
- [ ] Test login works: `dr.skander@example.tn` / `password123`
- [ ] **iPad Mini:** Open `https://doctor-q-web.vercel.app` and log in
- [ ] **Phone:** Keep ready to scan QR code or open check-in link
- [ ] Clear any old queue entries if needed (use "Vider la file" button)
- [ ] Test internet connection on both devices
- [ ] Both devices connected to same WiFi (or use mobile data)
- [ ] QR code link should point to: `https://doctor-q-web.vercel.app/checkin/{clinicId}`

### Key URLs:
- **Frontend:** `https://doctor-q-web.vercel.app`
- **API Health:** `https://doctorqapi-production-84e9.up.railway.app/health`
- **Check-in Page:** `https://doctor-q-web.vercel.app/checkin/7d4e22cd-4604-4a72-b624-7b718885b663`

### Test Credentials:
- **Email:** `dr.skander@example.tn`
- **Password:** `password123`
- **Clinic Name:** Cabinet Dr Skander Kamoun

### Quick Verification (run before demo):
```bash
# Check API is up
curl https://doctorqapi-production-84e9.up.railway.app/health

# Test login (should return token)
curl -X POST https://doctorqapi-production-84e9.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.skander@example.tn","password":"password123"}'
```

---

## Pro Tips for the Demo

1. **Use iPad + Phone** - iPad Mini for doctor dashboard, phone for patient view. Hold both devices so Dr. Kamoun can see the real-time sync.

2. **Let Dr. Kamoun interact** - Have him click "Call Next" himself to feel the simplicity.

3. **Show the confetti** - The "Your Turn" celebration is memorable and shows attention to patient experience.

4. **Emphasize "no app install"** - Patients just scan QR and use their browser.

5. **Mention WhatsApp sharing** - The QR code can be shared via WhatsApp to patients who called ahead.

6. **Address objections proactively:**
   - "What if internet is down?" → Patients can still come to the clinic normally
   - "My patients are elderly" → Receptionist can add them manually, they just wait normally
   - "What about appointments?" → Optional appointment time can be added when checking in

---

## Demo Flow Diagram

```
📱 iPad Mini (DOCTOR)                📱 Phone (PATIENT)
───────────────────────────────────────────────────
1. Login
   ↓
2. Show empty dashboard
   ↓
3. "Fill Queue" → 6 patients appear
   ↓
4. Demo reorder/emergency/remove
   ↓
5. Toggle "Doctor Present" ON
   ↓
6. "Call Next" (Patient #1)
   ↓                                 5a. (Scan QR or open link)
                                         ↓
                                     5b. Check-in with phone
                                         ↓
                                     5c. See position page
   ↓
7. "Call Next" (Patient #2)         7a. Position updates in real-time!
   ↓                                     ↓
8. Keep calling...                  8a. Watch position decrease
   ↓                                     ↓
9. Call the demo patient            9a. 🎉 CONFETTI! "It's Your Turn!"
   ↓
10. Toggle "Doctor Present" OFF     10a. Warning banner appears
```

---

## Backup Plan

If something doesn't work during the demo:
1. **API down:** Show screenshots/video of the flow
2. **Socket not updating:** Refresh the patient page manually
3. **Fill Queue fails:** Add 2-3 patients manually (still demonstrates the flow)

---

## Known Limitations (v0.5.0)

Be prepared to address these if asked:

| Feature | Status | Notes |
|---------|--------|-------|
| SMS Notifications | Not yet active | Will be enabled post-pilot |
| Average wait time | Displayed but inactive | Coming in v0.6 |
| WhatsApp integration | Planned | Phase 2 feature |
| Multi-language | French + Arabic | RTL supported |
| Admin dashboard | Internal only | Available at `/admin` |

---

## Post-Demo Follow-up

If Dr. Kamoun approves:
1. **Production launch:** Can go live Wed Jan 21 or Thu Jan 22
2. **Setup needed:**
   - Create his real clinic account (new email)
   - Print QR code poster for reception
   - Brief receptionist on adding walk-in patients
3. **Pricing:** 50 TND/month (first month free as pilot)
