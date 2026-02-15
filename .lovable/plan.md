
# FocusGuard UX & Feature Enhancement Plan

## Overview
This plan adds five major improvements to make the extension intuitive and powerful: per-site daily time limits with a dedicated UI, permanent unremovable blocks, clearer Focus Mode whitelist flow, a detailed Reports tab, and a guided onboarding/help system.

---

## 1. Per-Site Daily Time Limits (Dedicated Section)

**Problem:** Daily limits exist in Settings but are buried and hard to find.

**Solution:** Move daily limits into the **Access Policy** tab as a first-class feature with a clear UI.

### Changes:
- **`dashboard.html`** -- Add a "Daily Time Limits" card inside `#tab-blocklist` (Access Policy) with:
  - Domain input + minutes selector (dropdown: 15m, 30m, 1h, 2h, custom)
  - Visual list of active limits showing domain favicon, limit, usage progress bar, and remaining time
  - One-click "Set Limit" from the Network Access (domains) table rows
- **`dashboard.js`** -- Add `renderDailyLimits()` function that shows current limits with live usage data (queries today's usage to show "42/60 min used" with a progress bar)
- **`background.js`** -- Already has `checkDailyLimit` -- no changes needed; the backend is already wired

### UX Flow:
User sees YouTube in their domains list -> clicks "Set Limit" -> picks 60 minutes -> limit appears in Access Policy with a live usage bar

---

## 2. Permanent (Locked) Blocks

**Problem:** Users can unblock sites they want permanently blocked (like adult content). No "lock" mechanism exists.

**Solution:** Add a "Lock" toggle to blocked domains that requires a typed confirmation phrase to unlock.

### Changes:
- **`dashboard.html`** -- Add a lock icon button next to each blocked domain in the blocklist
- **`dashboard.js`** -- 
  - When locking: set `locked: true` on the domain object in settings
  - When trying to unlock a locked domain: show a confirmation modal requiring the user to type "UNLOCK [domain]" to proceed (cognitive friction)
  - Locked domains show a padlock icon and have the delete/toggle buttons disabled
- **`background.js`** -- Add `locked` field support in `updateBlockedDomain` and `unblockDomain` handlers; refuse to unblock if `locked: true` unless `forceUnlock: true` is passed
- **Storage schema update** -- blocked domain objects gain `locked: boolean` field

### UX Flow:
User blocks pornhub.com -> clicks lock icon -> domain shows padlock -> trying to remove it requires typing "UNLOCK pornhub.com"

---

## 3. Clearer Focus Mode Whitelist UX

**Problem:** Users are confused by the dual Block/Allow system in Focus Mode setup.

**Solution:** Simplify with a visual mode selector and clear explanations.

### Changes:
- **`dashboard.html`** (Focus Mode tab) -- Replace the current two separate cards with:
  - A **Mode Selector** at the top: two large clickable cards:
    - "Block Distractions" (default) -- "Block specific sites. Everything else stays accessible."
    - "Allow Only" (strict) -- "ONLY these sites will work. Everything else is blocked."
  - When "Allow Only" is selected, show a prominent warning banner and the allow-list input
  - When "Block Distractions" is selected, show the block-list input
  - Only one mode visible at a time -- reduces confusion
- **`dashboard.js`** -- Toggle visibility between the two panels based on mode selection; pass the correct lists to `startFocus`

---

## 4. Detailed Reports Tab

**Problem:** Insights tab is minimal. Users want to see "how many websites they visited today, last week, categorized."

**Solution:** Enhance the existing **Strategy Planner** (Insights) tab into a full reports view.

### Changes:
- **`dashboard.html`** -- Expand `#tab-insights` with:
  - **Summary Cards Row:** Total sites visited, Total time, Most visited category, Blocked attempts
  - **Date Range Selector:** Today / This Week / This Month / Custom
  - **Category Breakdown Table:** Each category with total time, site count, percentage bar
  - **Top 10 Sites Table:** Domain, category badge, total time, visits count, daily average
  - **Daily Comparison Chart:** Side-by-side bars for selected date range
- **`dashboard.js`** -- 
  - Add `loadReports(range)` function that aggregates data from `getLastNDays()`
  - Calculate per-category totals, per-domain rankings, visit counts
  - Render category breakdown with colored bars matching category colors from `Categories.getCategoryColor()`
- **`background.js`** -- Add `getMonthUsage` message handler (calls `Storage.getLastNDays(30)`)

---

## 5. Quick-Set Limit from Domains Table

**Problem:** No way to quickly set a daily limit from the domains list.

**Solution:** Add a "Set Limit" button to each row in the Network Access table.

### Changes:
- **`dashboard.html`** -- Add a "Limit" column to the domains table
- **`dashboard.js`** -- In `renderDomainsTable()`:
  - Show current limit if set (e.g., "60m") or a "Set" button
  - Clicking "Set" shows an inline input to pick minutes
  - Saves to `settings.dailyLimits`
  - Show usage progress if a limit is active (e.g., colored bar showing 42/60 min)

---

## Technical Details

### Files Modified:
1. **`extension/dashboard/dashboard.html`** -- New Daily Limits section in Access Policy, Focus Mode mode-selector, expanded Reports/Insights tab, limit column in domains table
2. **`extension/dashboard/dashboard.js`** -- New functions: `renderDailyLimits()`, `loadReports()`, focus mode-selector logic, inline limit setter, lock/unlock modal
3. **`extension/dashboard/dashboard.css`** -- Styles for mode selector cards, lock icons, progress bars, report tables, category breakdown bars
4. **`extension/background.js`** -- Add `locked` field support, `getMonthUsage` handler

### No New Dependencies
All features use vanilla JS, CSS, and the existing Chrome extension APIs.

### Implementation Order:
1. Focus Mode clarity (mode selector) -- simplest, highest UX impact
2. Daily Limits UI in Access Policy -- moves existing feature to a visible location
3. Quick-Set Limit from domains table -- builds on #2
4. Permanent Lock feature -- new blocking logic
5. Reports tab enhancement -- largest but self-contained
