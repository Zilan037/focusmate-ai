

# FocusGuard Extension V3 -- Advanced Upgrade

A comprehensive upgrade covering UI modernization, advanced features, detailed statistics, blocklist management, and overall user experience improvements across all extension pages.

---

## Part 1: Enhanced Settings & Blocklist Management

**Files: `dashboard/dashboard.html`, `dashboard.js`, `dashboard.css`**

**Blocked Domains -- Full CRUD UI:**
- Replace simple tag list with a proper table/list showing each blocked domain with:
  - Favicon + domain name
  - Date added (stored in settings)
  - Toggle switch to temporarily disable/enable blocking
  - Delete button with smooth remove animation (slide-out + fade)
  - "Block All" / "Unblock All" bulk actions
- Add search/filter input above the blocked list
- Add "Import blocklist" (paste comma-separated domains) and "Export blocklist" buttons

**Daily Limits -- Better Management:**
- Show each limit as a card with:
  - Domain favicon + name
  - Limit value (editable inline)
  - Progress bar showing today's usage vs limit
  - Delete button
- Sort by usage percentage (closest to limit first)

**New Settings Sections:**
- **Notifications**: Toggle for desktop notifications on focus complete, distraction loops, daily limit warnings
- **Scheduled Blocks**: UI to add/edit/delete time-based blocking schedules (days of week checkboxes, start/end time pickers)
- **Category Overrides**: Let users reassign a domain's category (dropdown with all categories)

---

## Part 2: Detailed Statistics & Analytics

**Files: `dashboard/dashboard.html`, `dashboard.js`, `dashboard.css`**

**Overview Page Enhancements:**
- Add "Today vs Yesterday vs Weekly Avg" comparison row below stat cards
- Add "Productivity Timeline" -- a horizontal bar showing productive/distracted/idle segments for each hour
- Add "Top 3 Productive Sites" and "Top 3 Distracting Sites" mini-cards with favicons and time
- Add "Sessions Completed Today" counter with a mini progress ring

**New "Deep Stats" Tab (replaces or extends Weekly):**
- **30-Day Trend Chart**: Line chart showing daily scores over the last 30 days
- **Category Time Breakdown by Day**: Stacked bar chart showing time per category per day (7 days)
- **Average Session Length**: Card showing average focus session duration trend
- **Distraction Frequency**: Chart showing number of distraction loops per day
- **Peak Productivity Windows**: Analysis showing which 2-hour blocks are most productive
- **Site Visit Frequency**: Bar chart showing how many times each site was visited (not just time)
- **Weekly Summary Card**: Total hours tracked, total focus sessions, best score, worst score, avg score

**Domain Analysis Enhancements:**
- Add 7-day sparkline mini-chart for each domain (tiny canvas showing usage trend)
- Add "First visit" and "Last visit" time columns
- Add percentage of total time column
- Color-code rows by category (subtle left border)
- Add pagination or "Show more" for long lists

---

## Part 3: UI Modernization & Premium Polish

**Files: `styles-common.css`, all page CSS files**

**Design System Additions:**
- Add CSS custom property `--radius-xs: 4px` for small elements
- Add `--font-mono: 'JetBrains Mono', 'SF Mono', monospace` for timer/number displays
- Add subtle noise texture overlay on body background (CSS only, using SVG data URI)
- Add `--transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)` for playful interactions

**Popup Upgrades:**
- Redesign score section with a gradient border card effect
- Add micro-interaction: score ring draws on load with easing
- Add "Quick Block" button that shows current tab's domain pre-filled
- Add skeleton loading states while data loads (pulsing placeholder bars)
- Smooth number transitions on all stats (already partially done, improve easing)
- Add a subtle bottom sheet "pull up" indicator for scrollable content

**Dashboard Upgrades:**
- Add breadcrumb-style page indicator at top of main content
- Sidebar nav items get tooltip on hover when collapsed
- Add "Last updated: X seconds ago" indicator with auto-refresh
- Charts get loading skeleton states
- Add smooth page transition when switching tabs (slide + fade)
- Table rows get alternating subtle background shading
- Add "Fullscreen" button on chart cards to view enlarged
- Mobile responsive: bottom tab bar with icons when sidebar hidden

**Blocked Page Upgrades:**
- Add ambient sound toggle (optional rain/focus sounds via Web Audio API oscillator)
- Make the override section collapsible (hidden by default, "I need to access this" link reveals it)
- Add motivational progress: "You've resisted X sites today"

---

## Part 4: Advanced Features

**Files: `background.js`, `dashboard/dashboard.js`, `popup/popup.js`**

**Pomodoro Timer Enhancement:**
- Add task input field before starting focus (comma-separated tasks)
- Show task checklist during active focus in popup
- Add break timer after focus completes (5-minute short break, 15-minute long break after 4 sessions)
- Track pomodoro cycle count (focus + break = 1 pomodoro)

**Smart Notifications (background.js):**
- Desktop notification when focus session completes
- Warning notification at 80% of daily limit
- Notification when distraction loop detected
- All notifications toggleable in settings

**Goal Setting & Tracking:**
- Daily focus goal (hours) -- configurable in settings
- Visual progress toward daily goal on popup and dashboard
- "Goal streak" -- consecutive days meeting the goal
- Weekly goal summary

**Keyboard Shortcuts:**
- `Alt+Shift+F` to start/stop focus mode
- `Alt+Shift+B` to block current site
- Register via `chrome.commands` in manifest

**Auto-Categorization Improvement (categories.js):**
- Add more domain patterns for better auto-detection
- Add "Neutral" category for sites that are neither productive nor distracting
- User overrides persist and take priority

---

## Part 5: Onboarding Improvements

**Files: `onboarding/onboarding.html`, `onboarding.css`, `onboarding.js`**

- Add a "Welcome back" screen if user reopens onboarding after completing it
- Add animated illustrations (CSS-only) for each step
- Add a progress percentage indicator (e.g., "Step 2 of 6 -- 33%")
- Add a "Skip" button that sets sensible defaults

---

## Part 6: Background.js New Message Handlers

- `getDetailedStats` -- returns 30-day trend data for deep stats tab
- `getDomainHistory` -- returns 7-day history for a specific domain (for sparklines)
- `setDailyGoal` / `getDailyGoal` -- goal management
- `getGoalProgress` -- today's progress toward goal
- `updateBlockedDomain` -- toggle enabled/disabled for individual blocked domain
- `bulkBlockDomains` / `bulkUnblockDomains` -- batch operations
- `getScheduledBlocks` / `saveScheduledBlock` / `deleteScheduledBlock`
- `setCategoryOverride` -- assign custom category to domain

---

## Part 7: Manifest Updates

**File: `extension/manifest.json`**

- Add `notifications` permission for desktop notifications
- Add `commands` section for keyboard shortcuts:
  ```
  "commands": {
    "toggle-focus": {
      "suggested_key": { "default": "Alt+Shift+F" },
      "description": "Toggle Focus Mode"
    },
    "block-current": {
      "suggested_key": { "default": "Alt+Shift+B" },
      "description": "Block Current Site"
    }
  }
  ```

---

## Part 8: Sync to Public

All modified files copied to `public/extension/` for download and testing.

---

## Implementation Order

1. `styles-common.css` -- New design tokens and utilities
2. `manifest.json` -- Permissions and commands
3. `background.js` -- New message handlers, notifications, commands
4. `utils/categories.js` -- Extended categorization
5. `popup/` -- UI upgrades, task input, goal progress
6. `dashboard/` -- Full overhaul (largest change): blocklist management, deep stats, scheduled blocks, category overrides
7. `blocked/` -- Collapsible override, resist counter
8. `onboarding/` -- Progress indicator, skip button
9. `content.js` -- Minor widget improvements
10. Copy all to `public/extension/`

---

## Technical Notes

- All data remains local via `chrome.storage.local` -- no backend
- Sparklines use inline `<canvas>` elements (50x20px)
- Notifications use `chrome.notifications.create()` API
- Keyboard shortcuts use `chrome.commands.onCommand` listener
- 30-day data uses existing `Storage.getLastNDays(30)` method
- Scheduled blocks stored as array in settings object
- No new external dependencies -- pure vanilla JS/CSS/HTML

