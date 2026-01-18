# Daily Progress

> **Progress is acknowledged, not judged.**

Daily Progress is a **daily-first personal dashboard** designed to help you remember what matters *today* and make calm, consistent progress — without pressure, streaks, or productivity guilt.

This is not a todo list.  
This is not a productivity tracker.  
It is a **memory and progress support system**.

---

## Why This Exists

Most todo apps are deadline-driven.  
They stay quiet for weeks, then suddenly shout when it's almost too late.

That creates:
- forgotten long-term work
- last-minute stress
- avoidance on low-energy days

Daily Progress flips the model:
- Items stay visible across days (when scheduled)
- You log **progress**, not just completion
- History exists to help you remember, not to judge you

Every day, the app answers one question:

> **"What did I move forward today?"**

---

## Core Philosophy

- **Daily-first, not deadline-first**
- **Progress over completion**
- **Recognition over reward**
- **Memory support over productivity pressure**
- **Respect for work/life boundaries**

If progress happens — even a small one — it **counts**.

---

## Key Concepts & Vocabulary

| Concept | Term Used |
|---------|-----------|
| Task / Activity | **Progress Item** |
| Taking action | **Log Progress** |
| Finished | **Settled** |
| History | **Progress Log** |
| Recurring routine | **Commitment** |
| Scheduled event | **Timeline Event** |

No "overdue".  
No "failed".  
No streaks.

---

## Features (Phase 1 – Personal MVP)

### Core Features
- ✅ **Daily Dashboard** - Single-screen view of everything that matters today
- ✅ **Timeline Events** - Time-anchored events with recurrence support
- ✅ **Progress Items** - Ongoing work organized by importance × urgency (Eisenhower Matrix)
- ✅ **Commitments** - Recurring routines (no end goal, just consistency)
- ✅ **Active Days** - Control which days items appear (e.g., weekdays only)
- ✅ **Progress Logging** - Record what moved forward with optional notes
- ✅ **Simple History** - Count-based summaries (daily/weekly/monthly)
- ✅ **Active/Settled Status** - Simple state management
- ✅ **Multi-device Sync** - Login and sync across devices
- ✅ **Offline-First PWA** - Works without internet, syncs when available

### Deferred to Phase 2
- ⏭️ Paused state
- ⏭️ Daily Reflection
- ⏭️ Heatmap visualization
- ⏭️ Advanced history filtering & search

---

## Three Types of Items

### 1. Timeline Events
**What:** Time-anchored events (meetings, appointments, reminders)

**Attributes:**
- Title
- Date & time
- Duration
- Recurrence pattern (optional)
- Days of week (for recurring events)

**Example:**  
"Team standup every Mon/Wed/Fri at 9:00 AM"

---

### 2. Progress Items
**What:** Ongoing work toward a goal or deadline

**Attributes:**
- Title
- Importance (High/Low)
- Urgency (High/Low)
- Optional deadline
- Active days (which days to show on Dashboard)
- Status (Active/Settled)

**Example:**  
"Draft grant proposal" - Important & Urgent, active Mon-Fri, deadline Jan 31

**Key behavior:**
- Appears on Dashboard only on active days
- Can log progress anytime (even on off-days via History)
- Stays visible until settled

---

### 3. Commitments
**What:** Recurring routines with no end goal

**Attributes:**
- Title
- Scheduled days (which days to show)

**Example:**  
"Exercise" - scheduled Mon/Wed/Fri  
"Take medication" - scheduled daily

**Key behavior:**
- Binary completion (done/not done per day)
- No progress notes needed
- Appears only on scheduled days

---

## Active Days Feature

**Problem:** Weekday work shouldn't nag you on weekends.

**Solution:** Set which days each item appears on the Dashboard.

**How it works:**
- When creating a Progress Item, select active days (e.g., Mon-Fri)
- Item appears in Matrix only on selected days
- On off-days, Dashboard shows rest-friendly empty state
- Can still log progress via History if motivated

**Example scenarios:**
- Work project: Active Mon-Fri
- Personal creative work: Active Sat-Sun
- Daily habit: Active all 7 days
- 3×/week routine: Active Mon/Wed/Fri

**Philosophy:** The system adapts to your rhythm, not the other way around.

---

## Dashboard Layout

**Single-screen vertical scroll:**

1. **📅 Timeline** - Today's events in chronological order
2. **🎯 Progress Items** - Eisenhower Matrix (4 quadrants, empty ones hidden)
3. **✓ Commitments** - Today's routines as checkboxes

**Empty state (e.g., Saturday with weekday-only items):**
- Timeline shows Saturday events
- Matrix shows: "No items scheduled for today"
- Subtle link to History for optional off-day work
- Tone: supportive, not pressuring

---

## What This App Is NOT

- ❌ A gamified productivity app
- ❌ A habit streak tracker  
- ❌ A project management tool
- ❌ A performance measurement system
- ❌ A team collaboration platform

---

## Tech Stack (Planned)

- **Frontend:** React (or similar modern framework)
- **Backend:** Node.js API + PostgreSQL (or similar)
- **Auth:** Email/password or OAuth
- **Storage:** Offline-first with IndexedDB, cloud sync
- **Platform:** Progressive Web App (installable, works offline)

---

## User Flows

### Daily Flow (Weekday)
1. Open app → See today's date
2. Scan Timeline for time-anchored events
3. Review Progress Items in Matrix
4. Check off Commitments as completed
5. Throughout day: Log progress on items with optional notes
6. Gentle acknowledgment for each log

### Daily Flow (Weekend with weekday-only items)
1. Open app → See today's date
2. Scan Timeline for weekend events
3. Matrix shows: "No items scheduled for today"
4. Option to view History and log progress anyway
5. No pressure, just support

### Creating a Progress Item
1. Tap + button
2. Choose "Progress Item"
3. Enter title
4. Set importance & urgency
5. Optionally add deadline
6. Select active days (default: weekdays)
7. Save → Item appears in appropriate Matrix quadrant on selected days

### Logging Progress
1. Tap Progress Item
2. See item details and history
3. Tap "Log Progress"
4. Optionally add note describing what moved forward
5. Save
6. See acknowledgment: "Progress logged ✓"

### Settling an Item
1. Open item detail
2. Tap "Mark as Settled"
3. Confirm
4. Item removed from Dashboard
5. Still visible in History
6. Message: "Settled. Well done."

---

## Status

**Current:** Personal MVP in design phase  
**Goal:** Built for real daily use, not scale  
**Philosophy:** Ship simple, learn from usage, iterate thoughtfully

---

## Guiding Rule

> **If it doesn't help today, it doesn't belong here.**

Progress is acknowledged, not judged.

---

## Contributing

This is currently a personal project. If you're interested in collaborating or have feedback, please reach out.

---

## License

TBD

---

## Contact

TBD