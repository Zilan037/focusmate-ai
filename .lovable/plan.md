

# FocusGuard: Domain Input Fix, Autocomplete, Blocked Sites Management, and Dashboard Polish

## What's Being Fixed

1. **Focus Mode "Allow Only" still not blocking** -- the domain input normalization and declarativeNetRequest rules need fixes
2. **Autocomplete suggestions** when typing website names
3. **Blocked sites management** section in dashboard and popup Activity tab
4. **Dashboard data display** fixes to show real tracking data

---

## 1. Fix Domain Input and Whitelist Blocking

**Problem:** When a user types `youtube.com`, the system stores it correctly but the declarativeNetRequest `requestDomains` field needs to include both the base domain AND `www.` variant. Also, if a user pastes `https://www.youtube.com/watch?v=...`, we need to strip it down to `youtube.com`.

**Changes in `background.js` (`applyFocusBlockingRules`):**
- For each allowed site, add BOTH the base domain and `www.` prefixed version to `requestDomains`
- Change the block-all rule to also use `urlFilter: "|https"` as a second rule (some sites are HTTPS-only and `|http` may not catch all patterns)
- Actually, the better approach: use TWO block-all rules -- one with `urlFilter: "|http"` and one with `urlFilter: "|https"` to ensure total coverage
- For the allow exceptions, include `www.DOMAIN` alongside the base domain in `requestDomains`

**Changes in `popup.js` and `dashboard.js` (`addFocusSite`):**
- Improve domain normalization: strip protocol, `www.`, trailing paths, query strings, hash fragments, and port numbers
- Handle edge cases like `https://www.youtube.com/watch?v=xxx` becoming `youtube.com`
- Handle `notion.so`, `docs.google.com` etc. correctly (don't strip subdomains other than `www`)

**Changes in `background.js` (`isDomainAllowed` and `isDomainInList`):**
- Already correct, but add an extra normalization step to strip any protocol or path that might have leaked through

---

## 2. Website Autocomplete Suggestions

**New: Popular websites database** -- Add a `POPULAR_SITES` array in `popup.js` and `dashboard.js` containing ~100 common domains organized by category (youtube.com, google.com, notion.so, github.com, reddit.com, twitter.com, etc.) sourced from `CategoryPatterns` in `categories.js`.

**Autocomplete behavior:**
- As user types in any site input field, show a dropdown with matching suggestions
- Match against the popular sites list + user's recently used domains (stored in `chrome.storage.local`)
- Recently used domains appear first, then popular matches
- Clicking a suggestion fills the input and adds it
- Dropdown appears below input, styled with proper z-index and background

**Changes:**
- `popup.html` / `popup.js`: Add autocomplete dropdown container below each site input, wire up `input` event listener
- `dashboard.html` / `dashboard.js`: Same for dashboard Focus Mode and blocklist inputs
- `background.js`: Add `getRecentDomains` message handler that returns the user's most-visited domains from usage data
- Store "recently blocked/allowed" domains list in storage for priority suggestions

---

## 3. Blocked Sites Management Section

**Dashboard -- new "Manage Blocked Sites" section:**
- Add a new card in the Access Policy tab (or a sub-section) showing all user-blocked domains (NOT system-default) with:
  - Domain name + favicon
  - "Unblock" button for each
  - Visual indicator if the domain has a daily limit set
- Filter out all `systemDefault: true` entries

**Popup Activity tab -- "Your Blocked Sites" section:**
- Add a scrollable list below the category pills showing user-blocked domains
- Each entry has: favicon, domain name, small "Unblock" button
- Max 10 shown, with "View all in Dashboard" link
- Filter out system-default domains

**Changes:**
- `popup.html`: Add `#blocked-sites-list` container in Activity tab
- `popup.js` (`loadActivityTab`): Fetch settings, filter user-blocked domains, render list with unblock buttons
- `dashboard.html`: Ensure the blocklist section in Access Policy properly renders (may already exist)
- `dashboard.js`: Ensure blocklist rendering filters system defaults

---

## 4. Dashboard Data and Chart Fixes

From the screenshot, the dashboard charts (Temporal Flow State, etc.) appear empty with no data. This is likely because:

- The hourly activity canvas (`chart-hourly`) needs the tracking data to be non-zero
- The charts rely on `usage.hourlyActivity` which may not have data yet or the chart rendering function has issues

**Changes in `dashboard.js`:**
- Add fallback/placeholder content when charts have no data ("Start browsing to see your data here")
- Ensure `loadOverview()` correctly reads and passes `hourlyActivity` data to the chart
- Verify that `loadComparisons()` and sparkline rendering handle zero-data gracefully
- Add a "Last updated" indicator that shows actual refresh time

---

## Technical Details

### Files Modified:
1. **`extension/background.js`** -- Fix `applyFocusBlockingRules` to add `www.` variants and dual http/https block rules; add `getRecentDomains` message handler
2. **`extension/popup/popup.html`** -- Add autocomplete dropdown containers; add blocked sites section in Activity tab
3. **`extension/popup/popup.js`** -- Autocomplete logic; blocked sites rendering in Activity tab; improved domain normalization in `addFocusSite`
4. **`extension/popup/popup.css`** -- Styles for autocomplete dropdown and blocked sites list
5. **`extension/dashboard/dashboard.html`** -- Ensure blocked sites management section exists in Access Policy
6. **`extension/dashboard/dashboard.js`** -- Autocomplete for dashboard inputs; improved domain normalization; chart empty-state handling; fix `loadFocusBlockedSites` to NOT pre-populate block list
7. **`extension/dashboard/dashboard.css`** -- Styles for autocomplete and blocked sites management

### Implementation Order:
1. Fix domain normalization and declarativeNetRequest rules (critical blocking fix)
2. Add blocked sites management to popup Activity tab and dashboard
3. Add autocomplete suggestions system
4. Fix dashboard chart empty states
