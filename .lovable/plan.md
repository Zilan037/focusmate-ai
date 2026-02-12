
# FocusGuard Premium UI & Feature Overhaul Plan

This plan addresses all reported issues: fixing the block page scrolling, implementing the full Focus Mode experience (Setup & Active states) within the extension dashboard, upgrading the overlay widget, and refining the dashboard UX.

## 1. Fix Block Page Scrolling (SS1)
The block page is stuck because of `overflow: hidden`.
- **File:** `extension/blocked/blocked.css`
- **Change:** Update `body` styles to allow vertical scrolling (`overflow-y: auto`) and ensure flex alignment doesn't cut off content on small screens.

## 2. Implement Full Focus Mode in Dashboard (SS3 & SS4)
The extension currently lacks the comprehensive Focus Mode setup and active screens shown in the React web app. We will migrate these fully into the extension dashboard.

### Dashboard HTML (`extension/dashboard/dashboard.html`)
- **Navigation:** Add a new "Focus Mode" tab in the sidebar under a new "Intervention" group.
- **Content:** Add a `#tab-focus` container with two main sections:
  - **Setup Phase (SS3):**
    - Duration selector (15m, 25m, 45m, 60m).
    - Task management input (add/remove tasks).
    - Blocked/Allowed sites management.
    - "Deploy Focus" button.
  - **Active Phase (SS4):**
    - Large countdown timer with progress ring.
    - Active task checklist.
    - Session stats (elapsed time, tasks done).
    - "Stop" and "Pause" controls.

### Dashboard Logic (`extension/dashboard/dashboard.js`)
- **State Management:** Logic to switch between Setup and Active views based on `background.js` focus state.
- **Interactions:** Handlers for starting focus, adding tasks/sites, and updating the timer/UI in real-time.
- **Sync:** Polling `getFocusState` to keep the UI in sync with the background worker.

### Dashboard Styling (`extension/dashboard/dashboard.css`)
- Add specific styles for the large timer, duration pills, and task inputs to match the premium design of SS3 and SS4.

## 3. Enhance Overlay Widget (SS5)
The overlay needs to show more context during a session.
- **File:** `extension/content.js`
- **Changes:**
  - Update the "Expanded" view to include:
    - **Blocked Sites List:** Clearly visible list of what's blocked.
    - **Allowed Sites List:** If in whitelist mode.
    - **Task Checklist:** Interactive checkboxes to mark tasks as done directly from the overlay.
  - Ensure the timer and progress ring match the SS5 design.

## 4. Fix Dashboard Features & UX (SS2)
Address the "features not working" feedback by improving clarity and feedback.
- **File:** `extension/dashboard/dashboard.js`
- **Domains Tab:**
  - Add clear "Blocked" badges or visual indicators for blocked rows in the "Network Access" table.
  - Ensure categories are correctly populated.
- **Blocklist Tab:**
  - Improve the display of blocked items to clearly show "added date" or "scheduled time" to answer "blocked for how long".

## 5. Connect Popup to Dashboard
- **File:** `extension/popup/popup.js`
- **Change:** Update the "Start Focus" button (and potentially a new "Open Focus Mode" button) to open the *Dashboard Focus Tab* instead of just starting a generic session, giving users access to the full setup options.

## Implementation Order
1.  **Styles:** Fix `blocked.css` scrolling immediately.
2.  **Dashboard HTML:** Insert the new Focus Mode tab structure.
3.  **Dashboard JS:** Implement the Focus Mode logic (Setup/Active switching).
4.  **Content JS:** Upgrade the overlay with the new lists.
5.  **Popup JS:** Redirect focus actions to the new Dashboard tab.
