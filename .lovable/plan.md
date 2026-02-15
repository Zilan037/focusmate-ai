
# FocusGuard: Fix Whitelist Blocking, Remove NSFW Names, Add Popup Focus Tab, Clean UI

## Overview

Five issues to fix: (1) The widget and dashboard Focus Mode display all blocked domain names including NSFW sites -- must filter those out, (2) Focus Mode "Allow Only" still not blocking properly, (3) Remove all NSFW/gambling domain names from all UI surfaces, (4) Create a dedicated Focus Mode tab inside the extension popup, (5) Clean up the popup UI.

---

## 1. Remove All NSFW/Gambling Domain Names from UI

The floating widget (`content.js`) loads ALL blocked domains and displays them as pills (lines 466-489), including pornhub.com, xvideos.com, etc. The dashboard Focus Mode setup also pre-loads all blocked domains into the "Sites to Block" panel (line 1565).

### Fix in `content.js`:
- Filter out system-default domains when rendering the "BLOCKED" section. Change line 467 to filter: only show domains where `systemDefault` is NOT true.
- Cap displayed blocked sites to user-added ones only.

### Fix in `dashboard.js` (`loadFocusBlockedSites`):
- Line 1565: Filter out system-default domains from the pre-loaded block list. Only load user-blocked domains into the Focus Mode "Sites to Block" panel.
- This prevents NSFW names from appearing in the Focus Mode setup UI.

### Fix in `popup.js`:
- Ensure no system-default domain names are ever rendered in the popup Controls tab or Quick Block section.

---

## 2. Fix "Allow Only" Whitelist (Still Not Working)

The `declarativeNetRequest` rules in `background.js` use `urlFilter: "*"` (line 671) which may not match correctly. The Chrome declarativeNetRequest API requires proper filter patterns.

### Root Cause:
The block-all rule uses `urlFilter: "*"` but `declarativeNetRequest` interprets `"*"` differently from a catch-all. The correct approach is to use `urlFilter: "*://*/*"` or `requestDomains` with an inverted match.

### Fix in `background.js` (`applyFocusBlockingRules`):
- Change the block-all rule to use `urlFilter: "||"` or `urlFilter: "*"` with `requestMethods` included, ensuring it catches all main_frame navigations.
- Actually, the better fix: use `urlFilter: "*://*/*"` which is the proper catch-all pattern for declarativeNetRequest.
- Add `"http", "https"` resource scheme filtering to ensure only web traffic is blocked.
- Add additional resource types beyond just `main_frame` and `sub_frame` to also block `xmlhttprequest`, `script`, `stylesheet`, `image` etc. -- this prevents SPAs from loading content from non-allowed domains.

### Also fix `webNavigation` listeners:
- Keep as fallback to show the blocked page UI (since declarativeNetRequest just drops the request silently, the user sees a generic browser error).
- Ensure `webNavigation.onBeforeNavigate` and `onCommitted` correctly redirect to the blocked page for non-allowed domains.

---

## 3. Simplify Focus Mode in Dashboard

### Focus Mode should have two clear sections:
1. **Allow Only** -- User adds websites. Only those are accessible. Everything else is blocked.
2. **Block Distractions** -- User adds websites. Only those are blocked. Everything else is accessible.

### Changes to `dashboard.html`:
- In the Focus Mode tab, do NOT pre-populate the "Sites to Block" with the user's global blocklist. Start with an empty list. The global blocklist + Safety Shield always apply regardless.
- Add clearer labels and descriptions to both panels.

### Changes to `dashboard.js`:
- Remove `loadFocusBlockedSites()` or change it to NOT auto-populate the focus block list with ALL blocked domains. The focus blocklist should only contain domains the user explicitly adds for this session.

---

## 4. Add Dedicated Focus Mode Tab in Extension Popup

Currently the popup has 3 tabs (Overview, Controls, Activity). The Focus Mode section is embedded in the Overview tab as a small compact area. Move it to its own dedicated tab.

### Changes to `popup.html`:
- Add a 4th tab button: **Focus** (with a clock/target icon)
- Create `#popup-tab-focus` content section with:
  - Duration selector (15m, 25m, 45m, 60m pills)
  - Task input (add tasks for the session)
  - Mode selector (Allow Only vs Block Distractions) as two clear cards
  - Site input for the selected mode (add allowed or blocked sites)
  - "Start Focus" button
  - Active focus state view (timer, tasks, pause/stop) -- same as existing but inside this tab
- Remove the Focus Mode section from the Overview tab to declutter it

### Changes to `popup.js`:
- Add `loadFocusTab()` function to populate the focus tab
- Handle task adding, site adding, mode switching, and deploying focus directly from the popup
- When focus is active, show the timer and task checklist in the focus tab
- Keep the quick overview of focus status in the Overview tab (just a small badge/indicator, not the full controls)

---

## 5. Clean Up Popup UI

### Changes to `popup.html` and `popup.css`:
- Remove Focus Mode controls from the Overview tab (moved to Focus tab)
- Tighten spacing, reduce padding
- Make the tab navigation more compact (4 tabs fit well with icons + short labels)
- Remove the bottom "Block Site" / "Dashboard" quick actions bar (redundant with Controls tab)
- Keep the keyboard shortcuts hint and footer

### Changes to `popup.css`:
- Ensure consistent card spacing
- Improve visual hierarchy in the Controls tab

---

## Technical Details

### Files Modified:
1. **`extension/background.js`** -- Fix `applyFocusBlockingRules()` to use correct `urlFilter` pattern for catch-all blocking
2. **`extension/content.js`** -- Filter out system-default domains from the blocked pills display
3. **`extension/dashboard/dashboard.js`** -- Remove auto-population of system-default domains in Focus Mode block list
4. **`extension/popup/popup.html`** -- Add Focus tab, remove focus controls from Overview, remove redundant bottom actions
5. **`extension/popup/popup.js`** -- Add focus tab logic with task/site management, mode selector, deploy, and active state
6. **`extension/popup/popup.css`** -- Styles for focus tab, cleaner layout

### Implementation Order:
1. Fix declarativeNetRequest blocking rules (critical bug)
2. Filter system-default domains from all UI surfaces
3. Clean up Focus Mode dashboard pre-population
4. Add Focus tab to popup
5. UI cleanup and polish
