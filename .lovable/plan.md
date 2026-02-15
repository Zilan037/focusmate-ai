

# FocusGuard: NSFW Auto-Block, Focus Mode Fix, and UI Cleanup

## Overview

Three critical fixes: (1) Permanently auto-block all adult/gambling/scam sites on install with no user override, (2) Fix the broken "Allow Only" whitelist in Focus Mode using declarativeNetRequest for true network-level blocking, and (3) Clean up the popup and dashboard UI.

---

## 1. Permanent NSFW/Gambling Auto-Block System

### Problem
Adult (18+) and Gambling categories are shown in the Quick Block UI, exposing harmful domain names to users. These should be silently and permanently blocked from the moment the extension is installed.

### Solution
- On `chrome.runtime.onInstalled`, automatically inject all Adult + Gambling domains from `CategoryPatterns` into `blockedDomains` with `{ locked: true, systemDefault: true }` flags. System-default domains cannot be unlocked or removed by the user -- the unlock modal will refuse them.
- Remove the "Adult (18+)" and "Gambling" buttons from the Quick Block Categories grid in `dashboard.html` and from the popup's Quick Block section.
- Add a prominent "Safety Shield" banner at the top of Access Policy that says: "FocusGuard automatically blocks all adult, gambling, and scam websites. This protection cannot be disabled."
- Expand the domain lists in `CategoryPatterns` with additional patterns and use keyword-based blocking in `checkBlocking` so even unlisted NSFW/gambling domains are caught (already partially implemented via `Categories.categorize` keyword fallback).

### Files Changed
- **`background.js`** -- Add `initSystemBlocklist()` called from `onInstalled`. It reads all Adult + Gambling domains from CategoryPatterns and DistractionDefaults, merges them into `settings.blockedDomains` with `systemDefault: true, locked: true`. Also block any domain matching NSFW/gambling keywords at the `checkBlocking` level regardless of user settings.
- **`dashboard.html`** -- Remove Adult and Gambling buttons from `#quick-category-grid`. Add Safety Shield info banner.
- **`dashboard.js`** -- Skip system-default domains in the unlock modal (refuse to unlock them). Show them with a special "System Protected" badge in the blocklist.
- **`popup.html`** -- Remove the Adult quick-block button from Controls tab.
- **`categories.js`** -- Add more NSFW/gambling domain patterns for broader coverage.

---

## 2. Fix "Allow Only" (Strict Whitelist) in Focus Mode

### Problem
When a user selects "Allow Only" and adds a site like `notion.so`, ALL other websites should be blocked. Currently, only explicitly blocked sites get blocked -- the whitelist enforcement has a race condition because `webNavigation.onBeforeNavigate` is an async informational event, not a blocking one. The navigation completes before the redirect fires.

### Solution
Use `chrome.declarativeNetRequest.updateDynamicRules()` to create actual network-level blocking rules when Focus Mode starts in "Allow Only" mode. This blocks requests at the browser engine level before they even reach the page -- no race conditions.

### Implementation
- When `startFocusMode` is called with `allowedSites.length > 0`:
  1. Create a dynamic declarativeNetRequest rule that blocks ALL URLs (`"*://*/*"`)
  2. Add exception rules for each allowed domain and its subdomains
  3. Always exempt `chrome-extension://` URLs
- When focus mode ends (`completeFocusSession` or `stopFocusMode`), remove all dynamic rules.
- Keep the existing `webNavigation` listeners as a visual fallback (shows the blocked page with a reason), but the real blocking happens at the network level.
- For "Block Distractions" mode, also add declarativeNetRequest rules for the explicitly blocked domains for more reliable enforcement.

### Files Changed
- **`background.js`** -- Add `applyFocusBlockingRules(allowedSites, blockedSites)` and `clearFocusBlockingRules()` functions using `chrome.declarativeNetRequest.updateDynamicRules`. Call them in `startFocusMode` and `completeFocusSession`/`stopFocusMode`.
- **`manifest.json`** -- Already has `declarativeNetRequest` permission and `rules.json`. No changes needed.

---

## 3. UI Cleanup and Simplification

### 3a. Access Policy Page
- Remove Adult/Gambling from Quick Block Categories grid
- Add a clean "Safety Shield" info card at top explaining auto-protection
- Better visual hierarchy: number each section (1. Safety Shield, 2. Block Websites, 3. Time Limits, 4. Scheduled Blocks)
- Add subtle helper text to each section explaining what it does

### 3b. Extension Popup
- Clean up spacing and reduce visual clutter in the Overview tab
- Remove the Adult quick-block button from Controls tab (since it is auto-blocked)
- Tighten the layout so it looks less "messy" -- reduce padding, consolidate action buttons, improve section spacing
- Make the current-site context card more prominent with clearer actions

### 3c. Floating Widget
- Add a confirmation step to "Block Site" (small inline confirm rather than instant action)
- Show daily limit progress bar if a limit exists for the current domain

### Files Changed
- **`dashboard.html`** -- Remove Adult/Gambling buttons, add Safety Shield banner
- **`dashboard.css`** -- Add styles for Safety Shield banner, section numbering
- **`popup.html`** -- Remove Adult button, tighten layout
- **`popup.css`** -- Reduce padding, improve spacing consistency
- **`content.js`** -- Add block confirmation step and limit progress display

---

## Technical Details

### Implementation Order
1. NSFW auto-block system in `background.js` + `onInstalled` initialization
2. declarativeNetRequest-based focus mode blocking
3. UI cleanup (dashboard + popup + widget)

### Key Architecture Decisions
- System-default blocked domains use `systemDefault: true` flag -- the UI code checks this flag and prevents any unlock/delete operations
- declarativeNetRequest rules use IDs 10000-19999 range to avoid conflicts with other rules
- The keyword-based fallback in `Categories.categorize` catches unlisted NSFW domains (domains containing "porn", "xxx", "casino", etc.)
- All changes are backwards-compatible with existing user data

