

# FocusGuard: Strict Whitelist Fix, Access Policy UX Overhaul, and Extension Popup Upgrade

## Overview

Three major improvements: (1) Fix the broken "Allow Only" whitelist blocking so it actually works, (2) Redesign the Access Policy page for clarity, and (3) Upgrade the extension popup with inline site controls and better navigation.

---

## 1. Fix Strict Whitelist Blocking (Critical Bug)

The "Allow Only" mode currently has a logic gap: `checkBlocking` in `background.js` only checks `allowedSites` during **Focus Mode**, but the check happens in `handleTabChange` which calls `checkBlocking` -- the problem is that `checkBlocking` correctly checks `focusState.allowedSites`, but the system relies on `chrome.tabs.onUpdated` which only fires once per page load. Navigating within a site (SPA-style) or opening new tabs may bypass it.

### Fix:
- **`background.js`**: Add a `chrome.webNavigation.onBeforeNavigate` listener (requires `webNavigation` permission) that intercepts ALL navigation attempts, not just tab updates. This ensures strict enforcement.
- **`background.js`**: Also add `chrome.webNavigation.onCommitted` as a fallback to catch any navigation that slips through.
- **`manifest.json`**: Add `"webNavigation"` to permissions array.
- **`background.js` > `checkBlocking`**: Add subdomain matching improvement -- `youtube.com` should also allow `www.youtube.com`, `m.youtube.com`, etc. Currently it checks `domain.endsWith("." + s)` which works, but also needs to match the exact domain. Fix: also strip `www.` from the stored allowed site before comparison.
- **`background.js`**: Always allow `chrome-extension://` URLs (extension's own pages) in whitelist mode -- currently there's a string check for `"chrome-extension"` but it should use protocol checking.

### Testing Scenario:
User selects "Allow Only" > adds `youtube.com` > Deploys Focus. Every other site (google.com, reddit.com, etc.) should redirect to blocked page. Only youtube.com and its subdomains should work.

---

## 2. Access Policy Page UX Overhaul

The current Access Policy tab mixes too many concepts without clear visual separation. Reorganize into distinct, labeled sections with helper text.

### Changes to `dashboard.html` (tab-blocklist):

Restructure into these clearly separated sections, each inside its own card:

1. **Safety Shield** (top) -- Strict Safety Mode toggle with a clear explanation banner
2. **Blocked Websites** -- Add domain input + blocklist table with lock/toggle/delete. Move Quick Block Categories inside this section as a collapsible "Quick Add" dropdown
3. **Daily Time Limits** -- Dedicated card with domain input + time selector + active limits list with progress bars
4. **Scheduled Blocks** -- Time-based blocking with day/time pickers
5. **Import/Export** -- Small action row at the bottom

Each section gets:
- A numbered step indicator or icon
- A short "What is this?" description in muted text
- Clear action buttons

### Changes to `dashboard.css`:
- Add `.access-section` class with clear borders, section numbers
- Add `.section-explainer` for helper text styling
- Better spacing between sections

---

## 3. Extension Popup Upgrade

### 3a. Add Tab Navigation to Popup

Add a compact bottom tab bar or top pill navigation to the popup with 3 views:

- **Overview** (default) -- Current score ring, stats, daily goal, insight (existing)
- **Controls** -- Site blocking, timer settings, focus mode quick-start
- **Activity** -- Top sites list, mini category breakdown

### Changes to `popup.html`:
- Add `.popup-nav` bar with 3 tab buttons (Overview, Controls, Activity)
- Wrap existing content in `#popup-tab-overview`
- Add `#popup-tab-controls` with:
  - **Current site context**: Show current tab's domain with block/timer/limit buttons
  - **Quick Block**: One-tap block current site
  - **Set Timer**: Inline dropdown to set daily limit for current site (15m/30m/1h/2h)
  - **Focus Quick-Start**: Duration selector + start button (starts directly, no redirect)
- Add `#popup-tab-activity` with:
  - Top 5 sites (existing, moved here)
  - Mini category breakdown pills

### Changes to `popup.js`:
- Add `setupPopupTabs()` for tab switching
- Add `loadControlsTab()` -- fetches current tab domain, checks if blocked, shows inline controls
- Add inline limit setter that saves via `chrome.runtime.sendMessage`
- Make focus start work directly from popup (not redirect to dashboard) for quick sessions

### 3b. Current Site Context Actions

When user opens popup while on `x.com`:
- Show "x.com" prominently at top of Controls tab
- Show category badge (e.g., "Social Media")
- Show time spent today (e.g., "42 min today")
- Action buttons: "Block", "Set Limit", "Add to Focus Blocklist"

### 3c. Upgrade Floating Widget (`content.js`)

- Add a "Block This Site" confirmation step (currently instant, add a small confirm tooltip)
- Add "Set Limit" button that opens a mini time picker (15m/30m/1h/2h) directly in the widget
- Show daily limit progress if one exists for current domain

---

## Technical Details

### Files Modified:
1. **`extension/manifest.json`** -- Add `webNavigation` permission
2. **`extension/background.js`** -- Add `webNavigation` listeners, fix whitelist domain matching, harden `checkBlocking`
3. **`extension/dashboard/dashboard.html`** -- Restructure Access Policy tab with clear sections and helper text
4. **`extension/dashboard/dashboard.css`** -- New styles for section layout, explainer text, numbered sections
5. **`extension/popup/popup.html`** -- Add tab navigation, controls tab with current-site context, activity tab
6. **`extension/popup/popup.js`** -- Add tab switching, controls logic, inline limit/block actions, direct focus start
7. **`extension/popup/popup.css`** -- Styles for popup tabs, controls UI, current-site card
8. **`extension/content.js`** -- Add limit setter and confirmation to floating widget

### Implementation Order:
1. Fix whitelist blocking in background.js (critical bug fix)
2. Add webNavigation permission to manifest
3. Restructure Access Policy HTML/CSS
4. Build popup tab navigation and controls tab
5. Upgrade floating widget with limit setter

